import { prisma } from "@/lib/db";
import { sendApplicationConfirmation } from "@/lib/email";
import { logger } from "@/lib/logger";
import { Prisma } from "@/generated/prisma";
import { getApplicationState } from "@/lib/system-settings";

// Simple in-memory rate limiter: max 5 applications per IP per 15 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up stale entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 30 * 60 * 1000);

export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip)) {
      return Response.json(
        { error: "Too many applications. Please try again later." },
        { status: 429 }
      );
    }

    // Admin-gated window check — even if someone hits the API directly, we
    // refuse when applications are closed or not yet open.
    const appState = await getApplicationState();
    if (!appState.isAcceptingApplications) {
      return Response.json(
        {
          error: appState.applicationsClosedNote || "Applications are currently closed.",
          reason: appState.reason,
          opensAt: appState.applicationsOpensAt?.toISOString() ?? null,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      fullName, email, country, ageRange, gender,
      currentStatus, experience, trackInterest,
      dedication, goals, referralSource,
    } = body;

    // Validate required fields
    if (!fullName || !email || !country || !ageRange || !currentStatus || !experience || !trackInterest || !dedication || !goals) {
      return Response.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    try {
      await prisma.publicApplication.create({
        data: {
          fullName: fullName.trim(),
          email: normalizedEmail,
          country: country.trim(),
          ageRange,
          gender: gender || null,
          currentStatus,
          experience: experience.trim(),
          trackInterest,
          dedication,
          goals: goals.trim(),
          referralSource: referralSource?.trim() || null,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        // Identify the actual colliding field so the error message doesn't
        // misleadingly blame email when a different unique index fired (e.g.
        // a stale index on a removed field that hasn't been db-pushed yet).
        const target = err.meta?.target;
        const targetStr = Array.isArray(target) ? target.join(",") : String(target ?? "");
        if (targetStr.toLowerCase().includes("email")) {
          return Response.json(
            { error: "An application with this email already exists." },
            { status: 409 }
          );
        }
        logger.error("application_unique_violation_unexpected", err, { target: targetStr });
        return Response.json(
          {
            error:
              "Could not save your application — a database constraint blocked it. The team has been notified.",
            collision: targetStr,
          },
          { status: 409 }
        );
      }
      throw err;
    }

    // Send the confirmation email synchronously. We used to fire-and-forget,
    // but on Vercel the lambda freezes after the response, killing the SMTP
    // send mid-flight. Better to wait the extra ~1s than to silently drop
    // the email. A failed send is logged but does not fail the application.
    try {
      await sendApplicationConfirmation(normalizedEmail, fullName.trim());
    } catch (err) {
      logger.error("send_application_confirmation_failed", err, { email: normalizedEmail });
    }

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    logger.error("application_submission_failed", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
