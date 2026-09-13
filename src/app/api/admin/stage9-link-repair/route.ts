import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSuperAdmin } from "@/lib/api-auth";
import { auditMetaFromRequest, recordAudit } from "@/lib/audit";
import {
  certificateIdFor,
  certificateUrl,
  dossierUrl,
  letterUrl,
  passLetterUrl,
  performanceRecordUrl,
  referenceUrl,
  verifyUrl,
} from "@/lib/certificate-link";
import { buildAddToProfileUrl } from "@/lib/linkedin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGE = "STAGE_9";
const SOURCE_RELEASE = "stage9-results-2026-09-13";
const FINAL_RELEASE = "stage9-results-2026-09-13-final-signed-links";
const ORIGIN = "https://ubuntubridgeinitiatives.org";
const EXPECTED_RECIPIENTS = 33;
const CONFIRMATION = "QUEUE_FINAL_STAGE9_LINK_REPAIR";

type Links = {
  certificate: string;
  verify: string;
  finalistLetter: string;
  closeLetter: string;
  reference: string;
  performance: string;
  dossier: string;
};

function contextString(value: unknown, key: string): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "string" ? field : null;
}

function releaseId(value: unknown): string | null {
  return contextString(value, "releaseId");
}

function linksFor(reportId: string, internId: string): Links {
  const base = { origin: ORIGIN, reportId, internId };
  return {
    certificate: certificateUrl(base),
    verify: verifyUrl(base),
    finalistLetter: passLetterUrl(base),
    closeLetter: letterUrl(base),
    reference: referenceUrl(base),
    performance: performanceRecordUrl(base),
    dossier: dossierUrl(base),
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function button(label: string, url: string, color = "#0F172A"): string {
  return `<tr><td style="padding:0 0 10px;"><a href="${escapeHtml(url)}" style="display:block;background:${color};color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:800;line-height:1.4;text-align:center;padding:13px 16px;border-radius:6px;">${escapeHtml(label)}</a></td></tr>`;
}

function correctionEmail(opts: {
  firstName: string;
  finalist: boolean;
  links: Links;
  linkedInUrl: string | null;
}): string {
  const documents = opts.finalist
    ? [
        ["Open Stage 9B finalist letter", opts.links.finalistLetter, "#0F766E"],
        ["Open reference letter", opts.links.reference, "#1D4ED8"],
        ["Open performance record", opts.links.performance, "#334155"],
        ["Open portfolio dossier", opts.links.dossier, "#0F766E"],
      ]
    : [
        ["Download Stage 9A certificate", opts.links.certificate, "#1D4ED8"],
        ["Open credential verification", opts.links.verify, "#0A66C2"],
        ...(opts.linkedInUrl ? [["Add Stage 9A credential to LinkedIn", opts.linkedInUrl, "#0A66C2"]] : []),
        ["Open personal closing letter", opts.links.closeLetter, "#0F172A"],
        ["Open reference letter", opts.links.reference, "#1D4ED8"],
        ["Open performance record", opts.links.performance, "#334155"],
        ["Open portfolio dossier", opts.links.dossier, "#0F766E"],
      ];

  return `<!doctype html><html lang="en"><body style="margin:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;color:#0F172A;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 14px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#FFF;border:1px solid #CBD5E1;border-top:5px solid #0F766E;"><tr><td style="padding:29px 27px 26px;"><div style="font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#0F766E;margin-bottom:8px;">Ubuntu Bridge Initiative · Final correction</div><h1 style="font-size:25px;line-height:1.25;margin:0 0 14px;color:#0F172A;">Your working Stage 9 links</h1><p style="font-size:15px;line-height:1.72;color:#334155;margin:0 0 13px;">Hi ${escapeHtml(opts.firstName)},</p><p style="font-size:15px;line-height:1.72;color:#334155;margin:0 0 21px;">The document buttons in the earlier result email carried invalid signatures. Please use the verified links below. Your score, result, track position and progression decision have not changed.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${documents.map(([label, url, color]) => button(label, url, color)).join("")}</table><p style="font-size:12px;line-height:1.65;color:#64748B;margin:17px 0 0;">This is the final link correction. Keep local copies of the documents you need.</p><p style="font-size:13px;line-height:1.7;color:#64748B;margin:23px 0 0;">With respect,<br><strong style="color:#0F172A;">Somto from UBI</strong><br>Programme Head</p></td></tr></table></td></tr></table></body></html>`;
}

async function buildRepair() {
  const rows = await prisma.emailQueueItem.findMany({
    where: { status: { in: ["PENDING", "SENT", "FAILED"] } },
    orderBy: { enqueuedAt: "asc" },
  });
  const source = rows.filter((row) => releaseId(row.context) === SOURCE_RELEASE && contextString(row.context, "outcome") !== "NO_SUBMISSION");
  const existing = rows.filter((row) => releaseId(row.context) === FINAL_RELEASE);
  if (source.length !== EXPECTED_RECIPIENTS) throw new Error(`Expected ${EXPECTED_RECIPIENTS} source messages; found ${source.length}`);
  if (source.some((row) => row.status !== "SENT")) throw new Error("Every assessed source result must be SENT before repair");
  if (existing.length) throw new Error(`Final correction already exists with ${existing.length} message(s)`);

  const reportIds = source.map((row) => contextString(row.context, "reportId"));
  if (reportIds.some((id) => !id)) throw new Error("A source result is missing its report ID");
  const reports = await prisma.stageReport.findMany({
    where: { id: { in: reportIds as string[] }, stage: STAGE },
    include: { intern: { include: { user: true } } },
  });
  const byId = new Map(reports.map((report) => [report.id, report]));
  if (byId.size !== EXPECTED_RECIPIENTS) throw new Error(`Expected ${EXPECTED_RECIPIENTS} Stage 9 reports; found ${byId.size}`);

  const repaired = source.map((sourceRow) => {
    const reportId = contextString(sourceRow.context, "reportId");
    const report = reportId ? byId.get(reportId) : null;
    if (!report || report.intern.user.id !== sourceRow.userId) throw new Error(`Recipient/report binding failed for ${sourceRow.id}`);
    const finalist = report.status === "PASSED";
    const links = linksFor(report.id, report.internId);
    const linkedInUrl = finalist ? null : buildAddToProfileUrl({
      stageKey: STAGE,
      issuedAt: report.finalizedAt ?? new Date(),
      certId: certificateIdFor(report.id),
      certUrl: links.verify,
      credentialName: "Advanced Stage 9A: The Final Case — Completed and Assessed",
    });
    return {
      userId: sourceRow.userId,
      toEmail: sourceRow.toEmail,
      kind: sourceRow.kind,
      subject: "Final correction: your working Stage 9 document links",
      body: correctionEmail({ firstName: report.intern.user.firstName || "there", finalist, links, linkedInUrl }),
      context: {
        releaseId: FINAL_RELEASE,
        repairedFromReleaseId: SOURCE_RELEASE,
        repairedFromQueueItemId: sourceRow.id,
        reportId: report.id,
        stage: STAGE,
        outcome: finalist ? "FINALIST_LINK_REPAIR" : "ASSESSED_DEPARTURE_LINK_REPAIR",
      },
      finalist,
      links,
    };
  });
  if (new Set(repaired.map((row) => row.toEmail.toLowerCase())).size !== EXPECTED_RECIPIENTS) throw new Error("Correction recipients are not unique");
  if (repaired.filter((row) => row.finalist).length !== 10 || repaired.filter((row) => !row.finalist).length !== 23) throw new Error("Correction outcome counts are not 10 finalists and 23 departures");
  return repaired;
}

async function check(label: string, url: string, status: number, contentType: string) {
  try {
    const response = await fetch(url, { cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(45_000) });
    const actualType = response.headers.get("content-type") ?? "";
    return { label, status: response.status, contentType: actualType, valid: response.status === status && actualType.startsWith(contentType) };
  } catch {
    return { label, status: 0, contentType: "", valid: false };
  }
}

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth.response) return auth.response;
  try {
    const repaired = await buildRepair();
    const finalist = repaired.find((row) => row.finalist)!;
    const departure = repaired.find((row) => !row.finalist)!;
    const checks = await Promise.all([
      check("finalist-certificate-blocked", finalist.links.certificate, 403, "application/json"),
      check("finalist-letter", finalist.links.finalistLetter, 200, "application/pdf"),
      check("finalist-reference", finalist.links.reference, 200, "application/pdf"),
      check("finalist-performance", finalist.links.performance, 200, "application/pdf"),
      check("finalist-dossier", finalist.links.dossier, 200, "application/pdf"),
      check("departure-certificate", departure.links.certificate, 200, "application/pdf"),
      check("departure-verification", departure.links.verify, 200, "text/html"),
      check("departure-letter", departure.links.closeLetter, 200, "application/pdf"),
      check("departure-reference", departure.links.reference, 200, "application/pdf"),
      check("departure-performance", departure.links.performance, 200, "application/pdf"),
      check("departure-dossier", departure.links.dossier, 200, "application/pdf"),
    ]);
    return Response.json({ ready: checks.length === 11 && checks.every((item) => item.valid), recipients: repaired.length, finalists: 10, departures: 23, checks });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Stage 9 link repair failed" }, { status: 409 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiSuperAdmin();
  if (auth.response) return auth.response;
  try {
    const body = await request.json();
    if (body?.confirmation !== CONFIRMATION) return Response.json({ error: "Explicit repair confirmation is required" }, { status: 400 });
    const repaired = await buildRepair();
    await prisma.emailQueueItem.createMany({
      data: repaired.map((row) => ({ userId: row.userId, toEmail: row.toEmail, kind: row.kind, subject: row.subject, body: row.body, context: row.context })),
    });
    await recordAudit({
      actor: auth.session,
      action: "STAGE9_RESULT_LINKS_REPAIRED",
      targetType: "STAGE_RESULTS",
      targetId: STAGE,
      details: { sourceRelease: SOURCE_RELEASE, finalRelease: FINAL_RELEASE, recipients: repaired.length, finalists: 10, assessedDepartures: 23, changed: "document URLs only" },
      ...auditMetaFromRequest(request),
    });
    return Response.json({ queued: repaired.length, releaseId: FINAL_RELEASE });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Stage 9 link repair failed" }, { status: 409 });
  }
}
