import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { auditMetaFromRequest, recordAudit } from "@/lib/audit";
import { getClientKey, rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import {
  FINALIST_PROJECT_DEADLINE_ISO,
  finalistProjectSubmissionsClosed,
} from "@/lib/finalist-project-deadline";

function finalistUrlError(value: unknown, kind: "project" | "video"): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return kind === "project" ? "Add the main project or demonstration URL." : "Add the Google Drive video URL.";
  }

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return "Paste a complete https:// URL.";
  }
  if (url.protocol !== "https:") return "The URL must begin with https://.";
  if (url.username || url.password) return "The URL must not contain login credentials.";

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    return "Use a public URL that the judges can open from another device.";
  }

  if (kind === "video") {
    if (host !== "drive.google.com") return "The video must be shared from Google Drive.";
    const isFile = /^\/file\/d\/[a-zA-Z0-9_-]+(?:\/|$)/.test(url.pathname);
    const isOpenLink = url.pathname === "/open" && Boolean(url.searchParams.get("id"));
    if (!isFile && !isOpenLink) return "Paste the Google Drive link for the video file, not a folder or Google Doc.";
  }

  return null;
}

async function finalistFor(userId: string) {
  return prisma.intern.findUnique({
    where: { userId },
    select: { id: true, finalist: true, isActive: true, track: true },
  });
}

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const intern = await finalistFor(session.id);
  if (!intern?.isActive || !intern.finalist) {
    return Response.json({ error: "This form is available only to Stage 9B finalists." }, { status: 403 });
  }

  const submission = await prisma.finalistProjectSubmission.findUnique({
    where: { internId: intern.id },
    select: {
      projectTitle: true,
      projectSummary: true,
      projectUrl: true,
      videoUrl: true,
      publicationConsent: true,
      submittedAt: true,
      updatedAt: true,
    },
  });

  return Response.json({
    submission,
    track: intern.track,
    deadline: FINALIST_PROJECT_DEADLINE_ISO,
    submissionsClosed: finalistProjectSubmissionsClosed(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const limited = await rateLimit(getClientKey(request, session.id), RATE_LIMITS.reportWrite);
    if (!limited.ok) return rateLimitResponse(limited);

    const intern = await finalistFor(session.id);
    if (!intern?.isActive || !intern.finalist) {
      return Response.json({ error: "This form is available only to Stage 9B finalists." }, { status: 403 });
    }
    if (finalistProjectSubmissionsClosed()) {
      return Response.json(
        { error: "The finalist project submission window closed on Tuesday, 6 October 2026 at 11:00 PM WAT." },
        { status: 409 },
      );
    }

    const payload = await request.json().catch(() => null);
    const projectTitle = typeof payload?.projectTitle === "string" ? payload.projectTitle.trim() : "";
    const projectSummary = typeof payload?.projectSummary === "string" ? payload.projectSummary.trim() : "";
    const projectUrl = typeof payload?.projectUrl === "string" ? payload.projectUrl.trim() : "";
    const videoUrl = typeof payload?.videoUrl === "string" ? payload.videoUrl.trim() : "";

    if (projectTitle.length < 5 || projectTitle.length > 120) {
      return Response.json({ error: "Project title must be between 5 and 120 characters." }, { status: 400 });
    }
    if (projectSummary.length < 80 || projectSummary.length > 1200) {
      return Response.json({ error: "Explain the project in 80 to 1,200 characters of plain English." }, { status: 400 });
    }
    const projectError = finalistUrlError(projectUrl, "project");
    if (projectError) return Response.json({ error: `Project URL: ${projectError}` }, { status: 400 });
    const videoError = finalistUrlError(videoUrl, "video");
    if (videoError) return Response.json({ error: `Video URL: ${videoError}` }, { status: 400 });
    if (payload?.publicationConsent !== true) {
      return Response.json({ error: "Confirm the publication and public-voting acknowledgement before submitting." }, { status: 400 });
    }

    const now = new Date();
    const submission = await prisma.finalistProjectSubmission.upsert({
      where: { internId: intern.id },
      create: {
        internId: intern.id,
        projectTitle,
        projectSummary,
        projectUrl,
        videoUrl,
        publicationConsent: true,
        submittedAt: now,
      },
      update: {
        projectTitle,
        projectSummary,
        projectUrl,
        videoUrl,
        publicationConsent: true,
        submittedAt: now,
      },
      select: { id: true, submittedAt: true, updatedAt: true },
    });

    await recordAudit({
      actor: session,
      action: "finalist-project.submit",
      targetType: "OTHER",
      targetId: submission.id,
      details: { internId: intern.id, track: intern.track, publicationConsent: true },
      ...auditMetaFromRequest(request),
    });

    return Response.json({ submission });
  } catch (error) {
    logger.error("finalist_project_submit_failed", error);
    return Response.json({ error: "Could not save the finalist project. Your entries remain in the form; please try again." }, { status: 500 });
  }
}
