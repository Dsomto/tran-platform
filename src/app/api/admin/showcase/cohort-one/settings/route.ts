import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auditMetaFromRequest, recordAudit } from "@/lib/audit";
import { guardAuthorisedAction } from "@/lib/email-send-guard";
import { json, requireShowcaseAdmin } from "@/lib/showcase-http";
import { launchBlockers } from "@/lib/showcase-admin";
import { SHOWCASE_KEY } from "@/lib/showcase-public";
import { getShowcaseSettings } from "@/lib/showcase-vote";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATES = ["DRAFT", "OPEN", "PAUSED", "CLOSED"] as const;
type State = (typeof STATES)[number];

function parseDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function PATCH(req: NextRequest) {
  const auth = await requireShowcaseAdmin();
  if (auth.response) return auth.response;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return json({ error: "Invalid request." }, 400);

  const existing = await prisma.finalistShowcaseSettings.findUnique({ where: { key: SHOWCASE_KEY }, select: { id: true } });
  if (!existing) return json({ error: "The showcase has not been prepared yet (no settings record)." }, 409);
  const before = await getShowcaseSettings();

  const data: { published?: boolean; votingState?: State; opensAt?: Date | null; closesAt?: Date | null } = {};
  if (body.published !== undefined) {
    if (typeof body.published !== "boolean") return json({ error: "published must be true or false." }, 400);
    data.published = body.published;
  }
  if (body.votingState !== undefined) {
    if (!STATES.includes(body.votingState)) return json({ error: "Unknown voting state." }, 400);
    data.votingState = body.votingState;
  }
  for (const field of ["opensAt", "closesAt"] as const) {
    const parsed = parseDate(body[field]);
    if (body[field] !== undefined && parsed === undefined) return json({ error: `${field} must be an ISO date or null.` }, 400);
    if (parsed !== undefined) data[field] = parsed;
  }
  const opensAt = data.opensAt !== undefined ? data.opensAt : before.opensAt;
  const closesAt = data.closesAt !== undefined ? data.closesAt : before.closesAt;
  if (opensAt && closesAt && closesAt <= opensAt) return json({ error: "The deadline must be after the opening time." }, 400);

  const opening = data.votingState === "OPEN" && before.votingState !== "OPEN";
  if (opening) {
    // Opening is the launch: only the authorised account, with fresh 2FA,
    // and only when every launch invariant holds.
    const denied = await guardAuthorisedAction(auth.session, body.totpCode, "Only the authorised account can open voting.");
    if (denied) return denied;
    if ((data.published ?? before.published) !== true) return json({ error: "Publish the showcase before opening voting." }, 409);
    const blockers = await launchBlockers();
    if (blockers.length > 0) return json({ error: "Voting cannot open yet.", blockers }, 409);
  }

  const after = await prisma.finalistShowcaseSettings.update({
    where: { key: SHOWCASE_KEY },
    data: { ...data, updatedById: auth.session.id },
    select: { published: true, votingState: true, opensAt: true, closesAt: true },
  });

  const action =
    data.votingState && data.votingState !== before.votingState
      ? ({ OPEN: before.votingState === "PAUSED" ? "showcase.voting.resume" : "showcase.voting.open", PAUSED: "showcase.voting.pause", CLOSED: "showcase.voting.close", DRAFT: "showcase.voting.draft" } as const)[data.votingState]
      : "showcase.settings.update";
  await recordAudit({
    actor: auth.session,
    action,
    targetType: "OTHER",
    targetId: "showcase:cohort-one",
    details: {
      before: { ...before, opensAt: before.opensAt?.toISOString() ?? null, closesAt: before.closesAt?.toISOString() ?? null },
      after: { ...after, opensAt: after.opensAt?.toISOString() ?? null, closesAt: after.closesAt?.toISOString() ?? null },
    },
    ...auditMetaFromRequest(req),
  });
  return json({ settings: after });
}
