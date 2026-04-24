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
    if (internCode && (typeof internCode !== "string" || !/^UBI-\d{4}-\d+$/i.test(internCode))) {
      errs.push("internCode");
    }

    if (errs.length) {
      return Response.json({ error: "Invalid input", fields: errs }, { status: 400 });
    }

    const app = await prisma.dataScholarshipApplication.create({
      data: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        country: country.trim(),
        internCode: internCode ? internCode.trim().toUpperCase() : null,
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
