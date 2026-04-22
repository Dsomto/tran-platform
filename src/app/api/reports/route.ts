import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { rateLimit, rateLimitResponse, getClientKey, RATE_LIMITS } from "@/lib/rate-limit";

const STAGE_KEYS = [
  "STAGE_0",
  "STAGE_1",
  "STAGE_2",
  "STAGE_3",
  "STAGE_4",
  "STAGE_5",
  "STAGE_6",
  "STAGE_7",
  "STAGE_8",
  "STAGE_9",
] as const;
type StageKey = (typeof STAGE_KEYS)[number];

function isStageKey(v: unknown): v is StageKey {
  return typeof v === "string" && (STAGE_KEYS as readonly string[]).includes(v);
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const intern = await prisma.intern.findUnique({ where: { userId: session.id } });
    if (!intern) return Response.json({ error: "Intern profile not found" }, { status: 404 });

    const reports = await prisma.stageReport.findMany({
      where: { internId: intern.id },
      orderBy: { stage: "asc" },
      select: {
        id: true,
        stage: true,
        status: true,
        version: true,
        score: true,
        feedback: true,
        submittedAt: true,
        gradedAt: true,
        updatedAt: true,
      },
    });

    return Response.json({ reports });
  } catch (error) {
    logger.error("list_reports_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const rl = rateLimit(getClientKey(request, session.id), RATE_LIMITS.reportWrite);
    if (!rl.ok) return rateLimitResponse(rl);

    const intern = await prisma.intern.findUnique({ where: { userId: session.id } });
    if (!intern) return Response.json({ error: "Intern profile not found" }, { status: 404 });

    const payload = await request.json();
    const { stage, executiveSummary, reportUrl, attachmentUrl } = payload ?? {};

    if (!isStageKey(stage)) {
      return Response.json({ error: "Invalid stage" }, { status: 400 });
    }
    if (typeof executiveSummary !== "string" || !executiveSummary.trim()) {
      return Response.json({ error: "Executive summary is required" }, { status: 400 });
    }
    if (executiveSummary.length > 5000) {
      return Response.json({ error: "Executive summary too long (max 5,000 chars)" }, { status: 400 });
    }
    for (const [name, val] of [
      ["reportUrl", reportUrl],
      ["attachmentUrl", attachmentUrl],
    ] as const) {
      if (val && typeof val === "string" && val.trim()) {
        try {
          const u = new URL(val);
          if (!/^https?:$/.test(u.protocol)) throw new Error();
        } catch {
          return Response.json(
            { error: `${name} must be a valid http(s) URL` },
            { status: 400 }
          );
        }
      }
    }

    const report = await prisma.stageReport.upsert({
      where: { internId_stage: { internId: intern.id, stage } },
      create: {
        internId: intern.id,
        stage,
        executiveSummary: executiveSummary.trim(),
        reportUrl: reportUrl?.trim() || null,
        attachmentUrl: attachmentUrl?.trim() || null,
        status: "DRAFT",
      },
      update: {
        executiveSummary: executiveSummary.trim(),
        reportUrl: reportUrl?.trim() || null,
        attachmentUrl: attachmentUrl?.trim() || null,
      },
    });

    return Response.json({ report }, { status: 201 });
  } catch (error) {
    logger.error("save_report_draft_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
