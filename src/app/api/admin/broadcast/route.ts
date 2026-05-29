import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { guardEmailSend } from "@/lib/email-send-guard";
import { logger } from "@/lib/logger";
import { Prisma } from "@/generated/prisma";
import { renderBroadcastEmail, personalizeText, firstNameOf } from "@/lib/broadcast-email";
import { getTemplate, renderTemplate, NEWSLETTER_TEMPLATES } from "@/lib/newsletter-templates";

// Newsletter / broadcast sender. Super-admin only.
//
// Like the decision emails, this does NOT send inline — it ENQUEUES
// EmailQueueItem rows (status PENDING). The /api/cron/email-drain cron
// delivers them gradually, lease-protected, with retries. So a broadcast to
// thousands is a couple of fast DB writes, never an SMTP fan-out that times out.
//
// GET  ?status=&track=&country=&stage=  — applicants matching the filters
//      (capped sample for the picker) plus the TRUE total count.
// POST { subject, message, applicationIds[] }   — send to a hand-picked set
//      { subject, message, sendToAll, filters }  — send to everyone matching

const CHUNK = 200;
// Display cap — the picker list is a sample for hand-picking individuals,
// not a data export. The true count is returned separately, and a
// send-to-all broadcast is never limited by this.
const PICKER_CAP = 2000;
// Sanity ceiling for a single send-to-all broadcast.
const SEND_ALL_CAP = 50000;

type FilterInput = {
  status?: unknown;
  track?: unknown;
  country?: unknown;
  stage?: unknown;
};

function buildWhere(f: FilterInput): Prisma.PublicApplicationWhereInput {
  const where: Prisma.PublicApplicationWhereInput = {};

  const status = typeof f.status === "string" ? f.status : "";
  if (status && status !== "all") where.status = status;

  const track = typeof f.track === "string" ? f.track.trim() : "";
  if (track) where.trackInterest = { contains: track, mode: "insensitive" };

  const country = typeof f.country === "string" ? f.country.trim() : "";
  if (country) where.country = { contains: country, mode: "insensitive" };

  const stageRaw = f.stage;
  const stage =
    typeof stageRaw === "number"
      ? stageRaw
      : typeof stageRaw === "string" && stageRaw !== "" && stageRaw !== "all"
      ? Number(stageRaw)
      : null;
  if (stage !== null && Number.isFinite(stage)) where.stage = stage;

  return where;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const p = new URL(request.url).searchParams;
  const where = buildWhere({
    status: p.get("status"),
    track: p.get("track"),
    country: p.get("country"),
    stage: p.get("stage"),
  });

  // The true number of people who match — this is what the UI must show.
  const total = await prisma.publicApplication.count({ where });

  const applicants = await prisma.publicApplication.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: PICKER_CAP,
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      trackInterest: true,
      country: true,
      stage: true,
    },
  });

  return Response.json({
    applicants,
    total,
    shown: applicants.length,
    capped: total > applicants.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json().catch(() => ({}));
    // Broadcast sends mail too: locked to the single authorised account + 2FA.
    // The co-super-admin can open the page but cannot send.
    const blocked = await guardEmailSend(session, body?.totpCode);
    if (blocked) return blocked;

    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const sendToAll = body?.sendToAll === true;

    // Template mode: caller picks a pre-built designed template + variables.
    // Bypasses the plain-text composer's HTML escape — template HTML is
    // trusted source code, not user input. Variables go through escape inside
    // the template's render fn where they're interpolated.
    const templateId = typeof body?.templateId === "string" ? body.templateId.trim() : "";
    const rawVars =
      body?.variables && typeof body.variables === "object" && !Array.isArray(body.variables)
        ? (body.variables as Record<string, unknown>)
        : {};
    const templateVars: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawVars)) {
      if (typeof v === "string") templateVars[k] = v;
    }
    const useTemplate = templateId.length > 0;

    if (useTemplate) {
      const tpl = getTemplate(templateId);
      if (!tpl) {
        return Response.json(
          { error: `Unknown template: ${templateId}. Known: ${NEWSLETTER_TEMPLATES.map((t) => t.id).join(", ")}.` },
          { status: 400 }
        );
      }
      for (const v of tpl.variables) {
        if (v.required && !(templateVars[v.name]?.trim() ?? "")) {
          return Response.json(
            { error: `Template variable "${v.label}" is required.` },
            { status: 400 }
          );
        }
      }
      // Subject may come from the admin, but template mode also allows the
      // template's defaultSubject to fill in. Either is fine, but at least
      // one must be present.
      if (!subject && !tpl.defaultSubject) {
        return Response.json({ error: "A subject is required." }, { status: 400 });
      }
    } else {
      if (!subject) return Response.json({ error: "A subject is required." }, { status: 400 });
      if (!message) return Response.json({ error: "A message is required." }, { status: 400 });
    }

    // Resolve the recipient set — either everyone matching the filters, or an
    // explicitly picked list of application IDs.
    let applicants: { id: string; email: string; fullName: string }[];

    if (sendToAll) {
      const where = buildWhere((body?.filters ?? {}) as FilterInput);
      applicants = await prisma.publicApplication.findMany({
        where,
        take: SEND_ALL_CAP,
        select: { id: true, email: true, fullName: true },
      });
      if (applicants.length === 0) {
        return Response.json(
          { error: "No applicants match those filters." },
          { status: 409 }
        );
      }
    } else {
      const ids: string[] = Array.isArray(body?.applicationIds)
        ? body.applicationIds.filter((x: unknown): x is string => typeof x === "string")
        : [];
      if (ids.length === 0) {
        return Response.json({ error: "Pick at least one recipient." }, { status: 400 });
      }
      applicants = await prisma.publicApplication.findMany({
        where: { id: { in: ids } },
        select: { id: true, email: true, fullName: true },
      });
      if (applicants.length === 0) {
        return Response.json(
          { error: "None of the selected recipients exist." },
          { status: 409 }
        );
      }
    }

    // Attach the queue row to a User where one exists (e.g. approved interns);
    // a plain applicant has no account, so userId stays null — same as the
    // rejection-email path.
    const users = await prisma.user.findMany({
      where: { email: { in: applicants.map((a) => a.email.toLowerCase()) } },
      select: { id: true, email: true },
    });
    const userByEmail = new Map(users.map((u) => [u.email, u.id]));

    // Each recipient gets their own personalised copy — {First name} in the
    // subject and message is filled with their actual name. Template mode
    // builds the HTML body via the template's render fn (trusted source);
    // plain-text mode runs through escapeHtml + linkify inside renderBroadcastEmail.
    const rows: Prisma.EmailQueueItemCreateManyInput[] = applicants.map((a) => {
      const firstName = firstNameOf(a.fullName);

      if (useTemplate) {
        // Pass the admin-edited subject through to renderTemplate so its
        // {{var}} + {First name} substitution applies to whatever the admin
        // actually typed (or kept as default). Previously the subject path
        // bypassed substituteVars, so a kept-default subject like
        // "Stage {{stage}} closes Friday — {First name}, …" went out with
        // {{stage}} as literal text.
        const rendered = renderTemplate({
          templateId,
          vars: templateVars,
          firstName,
          adminSubject: subject || undefined,
        });
        return {
          userId: userByEmail.get(a.email.toLowerCase()) ?? null,
          kind: "GENERAL",
          toEmail: a.email,
          subject: rendered?.subject ?? subject,
          body: rendered?.body ?? "",
          status: "PENDING",
          context: { type: "broadcast", applicationId: a.id, templateId },
        };
      }

      return {
        userId: userByEmail.get(a.email.toLowerCase()) ?? null,
        kind: "GENERAL",
        toEmail: a.email,
        subject: personalizeText(subject, firstName),
        body: renderBroadcastEmail({ message: personalizeText(message, firstName) }),
        status: "PENDING",
        context: { type: "broadcast", applicationId: a.id },
      };
    });

    let queued = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      await prisma.emailQueueItem.createMany({ data: chunk });
      queued += chunk.length;
    }

    return Response.json({ queued, requested: applicants.length });
  } catch (error) {
    logger.error("broadcast_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Enqueuing is a handful of DB writes; 300s is ample headroom even for a
// broadcast to several thousand recipients.
export const maxDuration = 300;
