import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { rateLimit, rateLimitResponse, getClientKey, RATE_LIMITS } from "@/lib/rate-limit";

// Public submit + admin list.
export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimit(getClientKey(request), RATE_LIMITS.publicForm);
    if (!rl.ok) return rateLimitResponse(rl);

    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      country,
      internCode,
      currentStage,
      dataSituation,
      reason,
      referralSource,
    } = body ?? {};

    const errs: string[] = [];
    if (typeof fullName !== "string" || !fullName.trim() || fullName.length > 120) errs.push("fullName");
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.push("email");
    if (typeof phone !== "string" || !phone.trim() || phone.length > 40) errs.push("phone");
    if (typeof country !== "string" || !country.trim() || country.length > 80) errs.push("country");
    if (typeof dataSituation !== "string" || dataSituation.trim().length < 20) errs.push("dataSituation");
    if (typeof reason !== "string" || reason.trim().length < 20) errs.push("reason");
    if (reason && reason.length > 3000) errs.push("reason_too_long");
    if (dataSituation && dataSituation.length > 3000) errs.push("dataSituation_too_long");
    // UBI Intern ID is required — scholarships are tracked to it. Accept any
    // format an intern might type ('UBI-2026-3', 'ubi-2026-0003', '  UBI -
    // 2026 - 03 ') and normalise to the zero-padded canonical form stored on
    // PublicApplication.internId. Previously a literal-string match rejected
    // interns who typed their own number without leading zeros.
    const normalised = typeof internCode === "string" ? normaliseInternId(internCode) : null;
    if (!normalised) {
      errs.push("internCode");
    }

    if (errs.length) {
      return Response.json({ error: "Invalid input", fields: errs }, { status: 400 });
    }

    // The ID must belong to a real enrolled intern. A UBI ID is only assigned
    // once an applicant is fully onboarded, so this both rejects typos and
    // blocks scholarship requests from people not actually in the programme.
    const enrolled = await prisma.publicApplication.findFirst({
      where: { internId: normalised! },
      select: { id: true },
    });
    if (!enrolled) {
      return Response.json(
        {
          error:
            "That UBI Intern ID was not found. Check your acceptance email — it looks like UBI-2026-XXXX.",
          fields: ["internCode"],
        },
        { status: 400 }
      );
    }

    const app = await prisma.dataScholarshipApplication.create({
      data: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        country: country.trim(),
        internCode: normalised!,
        currentStage: currentStage ? String(currentStage).slice(0, 120) : null,
        dataSituation: dataSituation.trim(),
        reason: reason.trim(),
        referralSource: referralSource ? String(referralSource).slice(0, 200) : null,
      },
    });

    return Response.json({ ok: true, applicationId: app.id }, { status: 201 });
  } catch (error) {
    logger.error("scholarship_submit_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Canonical UBI intern ID is `UBI-YYYY-NNNN` with a 4-digit zero-padded
// sequence (every PublicApplication.internId in the DB matches this
// format). Accept what interns actually type — extra whitespace, mixed
// case, missing leading zeros, even spaces around the dashes — and
// produce the canonical form for the DB lookup. Returns null if the
// shape isn't recognisable at all.
function normaliseInternId(raw: string): string | null {
  if (typeof raw !== "string") return null;
  // Strip every whitespace, including spaces between dashes.
  const compact = raw.replace(/\s+/g, "").toUpperCase();
  // Year up to 4 digits, sequence up to 5 digits (covers future cohorts).
  const m = compact.match(/^UBI-(\d{1,4})-(\d{1,5})$/);
  if (!m) return null;
  const year = m[1].padStart(4, "0");
  const seq = m[2].padStart(4, "0");
  return `UBI-${year}-${seq}`;
}

// Admin list.
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50") || 50));

    const where: Record<string, unknown> = {};
    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      where.status = status;
    }

    const apps = await prisma.dataScholarshipApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return Response.json({ applications: apps });
  } catch (error) {
    logger.error("scholarship_list_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
