import { prisma } from "./db";
import { emailHash, normalizeEmail, MAX_CODE_ATTEMPTS } from "./showcase-vote";
import {
  displayName,
  driveFileId,
  driveOpenUrl,
  EXPECTED_ENTRY_COUNT,
  EXPECTED_ROLL_SIZE,
  isShowcaseTrack,
  safePublicUrl,
  SHOWCASE_TRACKS,
  TRACK_LABEL,
  VOTING_AUDIENCE,
  type ShowcaseTrack,
} from "./showcase-public";
import { FINALIST_WHERE } from "./showcase-entries";

// ADMIN ONLY. Everything here reads vote data. Import it only from routes and
// pages that have already passed requireAdmin() / requireApiAdmin().

export type AdminEntryRow = {
  id: string;
  slug: string;
  track: ShowcaseTrack;
  finalistName: string;
  projectTitle: string;
  projectUrl: string;
  videoUrl: string;
  reviewedProjectUrl: string | null;
  reviewedVideoUrl: string | null;
  linkNote: string | null;
  published: boolean;
  consent: boolean;
  stillFinalist: boolean;
  votes: number;
  percentOfTrack: number;
};

export type ShowcaseResults = {
  entries: AdminEntryRow[];
  rollSize: number;
  publicVoters: number;
  verifiedVoters: number;
  completedBallots: number;
  remainingEligible: number | null;
  votesByTrack: Record<ShowcaseTrack, number>;
  reconciled: boolean;
  reconcileNotes: string[];
};

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 1000) / 10;
}

export async function getShowcaseResults(): Promise<ShowcaseResults> {
  const [entries, allVoters, publicVoters, verified, ballots, voteGroups, ballotsWithVotes] = await Promise.all([
    prisma.finalistShowcaseEntry.findMany({
      select: {
        id: true,
        slug: true,
        track: true,
        published: true,
        linkNote: true,
        reviewedProjectUrl: true,
        reviewedVideoUrl: true,
        submission: {
          select: {
            projectTitle: true,
            projectUrl: true,
            videoUrl: true,
            publicationConsent: true,
            intern: { select: { finalist: true, isActive: true, currentStage: true, user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    }),
    prisma.finalistShowcaseEligibleVoter.count(),
    prisma.finalistShowcaseEligibleVoter.count({ where: { origin: "PUBLIC" } }),
    prisma.finalistShowcaseVerification.findMany({
      where: { verifiedAt: { not: null } },
      distinct: ["voterId"],
      select: { voterId: true },
    }),
    prisma.finalistShowcaseBallot.count(),
    prisma.finalistShowcaseVote.groupBy({ by: ["entryId", "track"], _count: { _all: true } }),
    prisma.finalistShowcaseVote.groupBy({ by: ["ballotId"], _count: { _all: true } }),
  ]);

  const votesByEntry = new Map<string, number>();
  const votesByTrack = { SOC_ANALYSIS: 0, ETHICAL_HACKING: 0, GRC: 0 } as Record<ShowcaseTrack, number>;
  const reconcileNotes: string[] = [];
  for (const g of voteGroups) {
    votesByEntry.set(g.entryId, (votesByEntry.get(g.entryId) ?? 0) + g._count._all);
    if (isShowcaseTrack(g.track)) votesByTrack[g.track] += g._count._all;
  }

  const rows: AdminEntryRow[] = entries.flatMap((e) => {
    if (!isShowcaseTrack(e.track)) return [];
    const s = e.submission;
    const votes = votesByEntry.get(e.id) ?? 0;
    return [{
      id: e.id,
      slug: e.slug,
      track: e.track,
      finalistName: displayName(s.intern.user.firstName, s.intern.user.lastName),
      projectTitle: s.projectTitle,
      projectUrl: s.projectUrl,
      videoUrl: s.videoUrl,
      reviewedProjectUrl: e.reviewedProjectUrl,
      reviewedVideoUrl: e.reviewedVideoUrl,
      linkNote: e.linkNote,
      published: e.published,
      consent: s.publicationConsent,
      stillFinalist: s.intern.finalist && s.intern.isActive && s.intern.currentStage === FINALIST_WHERE.currentStage,
      votes,
      percentOfTrack: pct(votes, votesByTrack[e.track]),
    }];
  });
  rows.sort((a, b) => SHOWCASE_TRACKS.indexOf(a.track) - SHOWCASE_TRACKS.indexOf(b.track) || b.votes - a.votes);

  // Reconciliation: every vote row belongs to a ballot, no ballot holds more
  // than one vote per track, and per-entry totals add up to per-track totals.
  const votesTotal = voteGroups.reduce((sum, g) => sum + g._count._all, 0);
  const entryTotal = rows.reduce((sum, r) => sum + r.votes, 0);
  if (entryTotal !== votesTotal) reconcileNotes.push(`Votes on unknown entries: ${votesTotal - entryTotal}`);
  const overfull = ballotsWithVotes.filter((b) => b._count._all > SHOWCASE_TRACKS.length).length;
  if (overfull > 0) reconcileNotes.push(`${overfull} ballot(s) hold more votes than tracks`);
  if (ballotsWithVotes.length !== ballots) reconcileNotes.push(`${ballots - ballotsWithVotes.length} ballot(s) have no votes`);
  for (const track of SHOWCASE_TRACKS) {
    if (votesByTrack[track] > ballots) reconcileNotes.push(`${TRACK_LABEL[track]} has more votes than ballots`);
  }

  // Cohort One roll rows carry no origin; count them as the remainder so a
  // missing field (which a `null` filter would not match on Mongo) is counted.
  const rollSize = allVoters - publicVoters;
  return {
    entries: rows,
    rollSize,
    publicVoters,
    verifiedVoters: verified.length,
    completedBallots: ballots,
    remainingEligible: VOTING_AUDIENCE === "COHORT_ONE_ROLL" ? Math.max(0, rollSize - ballots) : null,
    votesByTrack,
    reconciled: reconcileNotes.length === 0,
    reconcileNotes,
  };
}

export function resultsCsv(results: ShowcaseResults): string {
  const cell = (v: string | number) => {
    const s = String(v);
    // Neutralise spreadsheet formula injection and quote every cell.
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const lines = [["Track", "Finalist", "Project", "Votes", "Percent of track"].map(cell).join(",")];
  for (const r of results.entries) {
    lines.push([TRACK_LABEL[r.track], r.finalistName, r.projectTitle, r.votes, r.percentOfTrack.toFixed(1)].map(cell).join(","));
  }
  lines.push("");
  lines.push([cell("Completed ballots"), cell(results.completedBallots)].join(","));
  lines.push([cell("Cohort One roll"), cell(results.rollSize)].join(","));
  lines.push([cell("Public voters registered"), cell(results.publicVoters)].join(","));
  return lines.join("\r\n") + "\r\n";
}

export type SuspiciousActivity = {
  lockedCodes: number;
  highFailureCodes: { voterRef: string; failedAttempts: number; createdAt: Date }[];
  busySignals: { signal: string; codeRequests: number; ballots: number }[];
};

// Shows only truncated, keyed hashes — enough to spot a pattern, not enough
// to identify a person or network.
export async function getSuspiciousActivity(): Promise<SuspiciousActivity> {
  const since = new Date(Date.now() - 24 * 60 * 60_000);
  const [lockedCodes, highFailure, requestGroups, ballotGroups] = await Promise.all([
    prisma.finalistShowcaseVerification.count({ where: { failedAttempts: { gte: MAX_CODE_ATTEMPTS } } }),
    prisma.finalistShowcaseVerification.findMany({
      where: { failedAttempts: { gte: 3 } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { voterId: true, failedAttempts: true, createdAt: true },
    }),
    prisma.finalistShowcaseVerification.groupBy({
      by: ["signalHash"],
      where: { createdAt: { gte: since }, signalHash: { not: null } },
      _count: { _all: true },
    }),
    prisma.finalistShowcaseBallot.groupBy({
      by: ["signalHash"],
      where: { signalHash: { not: null } },
      _count: { _all: true },
    }),
  ]);
  const ballotsBySignal = new Map(ballotGroups.map((g) => [g.signalHash, g._count._all]));
  const busySignals = requestGroups
    .map((g) => ({ signal: (g.signalHash ?? "").slice(0, 10), codeRequests: g._count._all, ballots: ballotsBySignal.get(g.signalHash) ?? 0 }))
    .concat(
      ballotGroups
        .filter((g) => !requestGroups.some((r) => r.signalHash === g.signalHash))
        .map((g) => ({ signal: (g.signalHash ?? "").slice(0, 10), codeRequests: 0, ballots: g._count._all })),
    )
    .filter((s) => s.codeRequests >= 10 || s.ballots >= 5)
    .sort((a, b) => b.ballots + b.codeRequests - (a.ballots + a.codeRequests))
    .slice(0, 20);
  return {
    lockedCodes,
    highFailureCodes: highFailure.map((v) => ({ voterRef: v.voterId.slice(-6), failedAttempts: v.failedAttempts, createdAt: v.createdAt })),
    busySignals,
  };
}

// Deletes one voter's ballot so they may vote again. Caller audits it with
// the reason and the removed choices.
export async function resetBallotByEmail(rawEmail: unknown): Promise<
  | { ok: true; ballotId: string; voterId: string; removedVotes: { track: string; entryId: string }[] }
  | { ok: false; status: number; error: string }
> {
  const email = normalizeEmail(rawEmail);
  if (!email) return { ok: false, status: 400, error: "Enter the voter's email address." };
  const voter = await prisma.finalistShowcaseEligibleVoter.findUnique({
    where: { emailHash: emailHash(email) },
    select: { id: true, ballot: { select: { id: true, votes: { select: { track: true, entryId: true } } } } },
  });
  if (!voter) return { ok: false, status: 404, error: "That email is not on the Cohort One voter roll." };
  if (!voter.ballot) return { ok: false, status: 404, error: "That voter has not submitted a ballot." };
  const ballot = voter.ballot;
  await prisma.$transaction([
    prisma.finalistShowcaseVote.deleteMany({ where: { ballotId: ballot.id } }),
    prisma.finalistShowcaseBallot.delete({ where: { id: ballot.id } }),
  ]);
  return { ok: true, ballotId: ballot.id, voterId: voter.id, removedVotes: ballot.votes };
}

export type LinkCheck = { entryId: string; kind: "project" | "video"; url: string | null; ok: boolean; status: number | null; note: string };

async function probe(url: string): Promise<{ status: number | null; finalUrl: string | null; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "user-agent": "UBI-Showcase-LinkCheck/1.0" },
    });
    await res.body?.cancel();
    return { status: res.status, finalUrl: res.url };
  } catch (err) {
    return { status: null, finalUrl: null, error: err instanceof Error ? err.name : "error" };
  }
}

// Server-side reachability probe for the admin pre-launch check. URLs are
// re-validated as public https before any request is made.
export async function checkEntryLinks(): Promise<LinkCheck[]> {
  const { entries } = await getShowcaseResults();
  const checks: Promise<LinkCheck>[] = [];
  for (const e of entries) {
    const project = safePublicUrl(e.reviewedProjectUrl ?? e.projectUrl);
    const videoSource = e.reviewedVideoUrl ?? e.videoUrl;
    const video = driveFileId(videoSource) ? driveOpenUrl(videoSource) : null;
    checks.push(
      (async (): Promise<LinkCheck> => {
        if (!project) return { entryId: e.id, kind: "project", url: null, ok: false, status: null, note: "Not a public https URL" };
        const r = await probe(project);
        const ok = r.status !== null && r.status < 400;
        return { entryId: e.id, kind: "project", url: project, ok, status: r.status, note: ok ? "Reachable" : r.error ?? `HTTP ${r.status}` };
      })(),
      (async (): Promise<LinkCheck> => {
        if (!video) return { entryId: e.id, kind: "video", url: null, ok: false, status: null, note: "Not a Google Drive file link" };
        const r = await probe(video);
        // A private Drive file answers 200 on the sign-in page, so judge by
        // where the request ended up, not only by status.
        const signIn = r.finalUrl?.includes("accounts.google.com") ?? false;
        const ok = r.status !== null && r.status < 400 && !signIn;
        return { entryId: e.id, kind: "video", url: video, ok, status: r.status, note: signIn ? "Requires Google sign-in (not shared publicly)" : ok ? "Publicly viewable" : r.error ?? `HTTP ${r.status}` };
      })(),
    );
  }
  return Promise.all(checks);
}

// ── Launch readiness (read-only) ───────────────────────────────────────────

// Uniqueness is what stops double ballots, so voting must not open unless the
// database actually enforces it.
const REQUIRED_UNIQUE_INDEXES: Record<string, string[][]> = {
  FinalistShowcaseBallot: [["voterId"]],
  FinalistShowcaseVote: [["ballotId", "track"]],
  FinalistShowcaseEligibleVoter: [["emailHash"], ["publicApplicationId"]],
  FinalistShowcaseEntry: [["submissionId"], ["slug"]],
};

type ListIndexesReply = { cursor?: { firstBatch?: { key: Record<string, unknown>; unique?: boolean }[] } };

export async function missingUniqueIndexes(): Promise<string[]> {
  const missing: string[] = [];
  for (const [collection, keys] of Object.entries(REQUIRED_UNIQUE_INDEXES)) {
    let existing: { key: Record<string, unknown>; unique?: boolean }[] = [];
    try {
      const reply = (await prisma.$runCommandRaw({ listIndexes: collection })) as ListIndexesReply;
      existing = reply.cursor?.firstBatch ?? [];
    } catch {
      existing = [];
    }
    for (const fields of keys) {
      const found = existing.some((ix) => ix.unique && Object.keys(ix.key).join(",") === fields.join(","));
      if (!found) missing.push(`${collection}(${fields.join(", ")})`);
    }
  }
  return missing;
}

export async function launchBlockers(): Promise<string[]> {
  const blockers: string[] = [];
  const { entries, rollSize } = await getShowcaseResults();
  if (VOTING_AUDIENCE === "COHORT_ONE_ROLL" && rollSize !== EXPECTED_ROLL_SIZE) {
    blockers.push(`Voter roll holds ${rollSize}; expected exactly ${EXPECTED_ROLL_SIZE}.`);
  }
  for (const track of SHOWCASE_TRACKS) {
    const live = entries.filter((e) => e.track === track && e.published && e.consent && e.stillFinalist).length;
    if (live !== EXPECTED_ENTRY_COUNT[track]) blockers.push(`${TRACK_LABEL[track]} has ${live} published entries; expected ${EXPECTED_ENTRY_COUNT[track]}.`);
  }
  const missing = await missingUniqueIndexes();
  if (missing.length > 0) blockers.push(`Missing unique indexes: ${missing.join("; ")}.`);
  return blockers;
}
