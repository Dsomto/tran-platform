import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auditMetaFromRequest, recordAudit } from "@/lib/audit";
import { json, requireShowcaseAdmin } from "@/lib/showcase-http";
import { driveFileId, isObjectId, safePublicUrl } from "@/lib/showcase-public";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Publication metadata only. The finalist's submission is never edited here.
export async function PATCH(req: NextRequest) {
  const auth = await requireShowcaseAdmin();
  if (auth.response) return auth.response;
  const body = await req.json().catch(() => null);
  if (!isObjectId(body?.entryId)) return json({ error: "Unknown entry." }, 400);

  const data: { published?: boolean; publishedAt?: Date | null; linkNote?: string | null; reviewedVideoUrl?: string | null; reviewedProjectUrl?: string | null } = {};
  if (body.published !== undefined) {
    if (typeof body.published !== "boolean") return json({ error: "published must be true or false." }, 400);
    data.published = body.published;
    data.publishedAt = body.published ? new Date() : null;
  }
  if (body.linkNote !== undefined) {
    if (body.linkNote !== null && (typeof body.linkNote !== "string" || body.linkNote.length > 500)) return json({ error: "Keep the note under 500 characters." }, 400);
    data.linkNote = body.linkNote ? body.linkNote.trim() : null;
  }
  if (body.reviewedVideoUrl !== undefined) {
    if (body.reviewedVideoUrl && !driveFileId(body.reviewedVideoUrl)) return json({ error: "The reviewed video must be a Google Drive file link." }, 400);
    data.reviewedVideoUrl = body.reviewedVideoUrl || null;
  }
  if (body.reviewedProjectUrl !== undefined) {
    if (body.reviewedProjectUrl && !safePublicUrl(body.reviewedProjectUrl)) return json({ error: "The reviewed project link must be a public https URL." }, 400);
    data.reviewedProjectUrl = body.reviewedProjectUrl || null;
  }

  const entry = await prisma.finalistShowcaseEntry.findUnique({ where: { id: body.entryId }, select: { id: true, published: true } });
  if (!entry) return json({ error: "Unknown entry." }, 404);
  const updated = await prisma.finalistShowcaseEntry.update({ where: { id: entry.id }, data, select: { id: true, published: true, linkNote: true } });

  await recordAudit({
    actor: auth.session,
    action: data.published === undefined ? "showcase.entry.update" : data.published ? "showcase.entry.publish" : "showcase.entry.unpublish",
    targetType: "OTHER",
    targetId: entry.id,
    details: { changes: Object.keys(data), wasPublished: entry.published, published: updated.published },
    ...auditMetaFromRequest(req),
  });
  return json({ entry: updated });
}
