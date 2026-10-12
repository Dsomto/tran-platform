import assert from "node:assert/strict";
import { before, after, test } from "node:test";

// Integration tests for showcase voting against a REAL MongoDB replica set
// (transactions + unique indexes behave as on Atlas). They run only when
// SHOWCASE_TEST_DATABASE_URL points at a local, throwaway database, and they
// refuse anything else so they can never touch production.
//
//   SHOWCASE_TEST_DATABASE_URL=mongodb://127.0.0.1:PORT/showcase_test?replicaSet=testset \
//     npx tsx --test src/lib/showcase-vote.test.ts

const url = process.env.SHOWCASE_TEST_DATABASE_URL ?? "";
const local = /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url);
const skip = local ? false : "set SHOWCASE_TEST_DATABASE_URL to a local throwaway replica set";

process.env.DATABASE_URL = url;
process.env.NEXTAUTH_SECRET ||= "test-secret-test-secret-test-secret-0123456789";
process.env.SMTP_USER ||= "test";
process.env.SMTP_PASS ||= "test";

type Mods = {
  db: typeof import("./db");
  vote: typeof import("./showcase-vote");
  entries: typeof import("./showcase-entries");
  admin: typeof import("./showcase-admin");
  pub: typeof import("./showcase-public");
};
let m: Mods;
const ENTRY: Record<string, string[]> = {};
let unpublishedId = "";

// Test-only mirror of the production unique indexes.
const INDEXES: Record<string, { key: Record<string, 1 | -1>; name: string; unique?: boolean }[]> = {
  FinalistShowcaseEntry: [
    { key: { submissionId: 1 }, name: "FinalistShowcaseEntry_submissionId_key", unique: true },
    { key: { slug: 1 }, name: "FinalistShowcaseEntry_slug_key", unique: true },
  ],
  FinalistShowcaseSettings: [{ key: { key: 1 }, name: "FinalistShowcaseSettings_key_key", unique: true }],
  FinalistShowcaseEligibleVoter: [
    { key: { publicApplicationId: 1 }, name: "FinalistShowcaseEligibleVoter_publicApplicationId_key", unique: true },
    { key: { emailHash: 1 }, name: "FinalistShowcaseEligibleVoter_emailHash_key", unique: true },
  ],
  FinalistShowcaseBallot: [{ key: { voterId: 1 }, name: "FinalistShowcaseBallot_voterId_key", unique: true }],
  FinalistShowcaseVote: [{ key: { ballotId: 1, track: 1 }, name: "FinalistShowcaseVote_ballotId_track_key", unique: true }],
};

const APP_FIELDS = { country: "NG", ageRange: "18-24", currentStatus: "x", experience: "x", trackInterest: "x", dedication: "x", goals: "x" };

const voterEmail = (i: number) => `voter${i}@example.test`;

async function setState(votingState: "DRAFT" | "OPEN" | "PAUSED" | "CLOSED", extra: Record<string, unknown> = {}) {
  await m.db.prisma.finalistShowcaseSettings.update({ where: { key: "cohort-one" }, data: { votingState, ...extra } });
}

async function verifiedSession(i: number) {
  const req = await m.vote.requestVotingCode(voterEmail(i), "203.0.113.9");
  assert.ok(req.deliver, `voter ${i} should get a code`);
  const ver = await m.vote.verifyVotingCode(voterEmail(i), req.deliver.code);
  assert.equal(ver.status, 200);
  return m.vote.readVoterSession(ver.token)!;
}

function fullBallot(pick = 0) {
  return { SOC_ANALYSIS: ENTRY.SOC_ANALYSIS[pick % 4], ETHICAL_HACKING: ENTRY.ETHICAL_HACKING[pick % 3], GRC: ENTRY.GRC[pick % 3] };
}

before(async () => {
  if (skip) return;
  m = {
    db: await import("./db"),
    vote: await import("./showcase-vote"),
    entries: await import("./showcase-entries"),
    admin: await import("./showcase-admin"),
    pub: await import("./showcase-public"),
  };
  const p = m.db.prisma;
  await p.$runCommandRaw({ dropDatabase: 1 });
  for (const [collection, indexes] of Object.entries(INDEXES)) {
    await p.$runCommandRaw({ createIndexes: collection, indexes: indexes.map((i) => ({ key: i.key, name: i.name, ...(i.unique ? { unique: true } : {}) })) });
  }

  // 506 eligible applications + rows the roll must exclude.
  const sent = new Date("2026-05-01T00:00:00Z");
  await p.publicApplication.createMany({
    data: [
      ...Array.from({ length: 506 }, (_, i) => ({ email: voterEmail(i), status: "approved", credentialsEmailSentAt: sent })),
      { email: "preview@example.test", status: "preview", credentialsEmailSentAt: sent },
      { email: "nocreds@example.test", status: "approved" },
    ].map((row, i) => ({ ...APP_FIELDS, fullName: `Test ${i}`, ...row })),
  });

  // Finalists: 4 SOC, 3 EH, 3 GRC, plus one eliminated and one without consent.
  const plan: [string, boolean, boolean][] = [
    ...Array.from({ length: 4 }, () => ["SOC_ANALYSIS", true, true] as [string, boolean, boolean]),
    ...Array.from({ length: 3 }, () => ["ETHICAL_HACKING", true, true] as [string, boolean, boolean]),
    ...Array.from({ length: 3 }, () => ["GRC", true, true] as [string, boolean, boolean]),
    ["GRC", false, true],
    ["SOC_ANALYSIS", true, false],
  ];
  for (const [i, [track, active, consent]] of plan.entries()) {
    const user = await p.user.create({ data: { email: `finalist${i}@example.test`, password: "x", firstName: `Finalist${i}`, lastName: "TEST", role: "INTERN" } as never });
    const intern = await p.intern.create({ data: { userId: user.id, track, currentStage: "STAGE_9", isActive: active, finalist: true } as never });
    await p.finalistProjectSubmission.create({
      data: {
        internId: intern.id,
        projectTitle: `Project ${i}: a tool`,
        projectSummary: "A plain-English summary of the project that is long enough to be realistic for the showcase card.",
        projectUrl: `https://github.com/example/project-${i}`,
        videoUrl: `https://drive.google.com/file/d/1FakeDriveFileId${i}xxxxx/view?usp=sharing`,
        publicationConsent: consent,
      },
    });
  }

  const roll = await m.entries.planVoterRoll();
  const entryPlan = await m.entries.planShowcaseEntries();
  await p.finalistShowcaseEligibleVoter.createMany({ data: roll });
  for (const e of entryPlan) {
    const created = await p.finalistShowcaseEntry.create({ data: { submissionId: e.submissionId, slug: e.slug, track: e.track, published: true, publishedAt: new Date() } });
    (ENTRY[e.track] ??= []).push(created.id);
  }
  // A real but unpublished entry, used to prove it cannot receive votes.
  const spare = await p.finalistProjectSubmission.findFirst({ where: { publicationConsent: false }, select: { id: true } });
  const hidden = await p.finalistShowcaseEntry.create({ data: { submissionId: spare!.id, slug: "hidden-entry", track: "SOC_ANALYSIS", published: false } });
  unpublishedId = hidden.id;
  await p.finalistShowcaseSettings.create({ data: { key: "cohort-one", published: true, votingState: "DRAFT" } });
});

after(async () => {
  if (!skip) await m.db.prisma.$disconnect();
});

test("roll and entry plans fail closed and match the launch invariants", { skip }, async () => {
  const roll = await m.entries.planVoterRoll();
  assert.equal(roll.length, 506);
  assert.equal(new Set(roll.map((r) => r.emailHash)).size, 506);
  const plan = await m.entries.planShowcaseEntries();
  assert.deepEqual(
    { soc: plan.filter((p) => p.track === "SOC_ANALYSIS").length, eh: plan.filter((p) => p.track === "ETHICAL_HACKING").length, grc: plan.filter((p) => p.track === "GRC").length },
    { soc: 4, eh: 3, grc: 3 },
  );
  await m.db.prisma.publicApplication.create({ data: { ...APP_FIELDS, fullName: "Late", email: "late@example.test", status: "approved", credentialsEmailSentAt: new Date() } });
  await assert.rejects(m.entries.planVoterRoll(), /failed closed/);
  await m.db.prisma.publicApplication.delete({ where: { email: "late@example.test" } });
  assert.deepEqual(await m.admin.missingUniqueIndexes(), []);
});

test("exactly ten consented entries render publicly, with no vote-shaped data", { skip }, async () => {
  const entries = await m.entries.loadPublicEntries();
  assert.equal(entries.length, 10);
  assert.deepEqual(
    m.pub.SHOWCASE_TRACKS.map((t) => entries.filter((e) => e.track === t).length),
    [4, 3, 3],
  );
  for (const e of entries) {
    assert.deepEqual(Object.keys(e).sort(), [...m.pub.PUBLIC_ENTRY_KEYS].sort());
    assert.match(e.videoEmbedUrl ?? "", /\/preview$/);
  }
  assert.ok(!entries.some((e) => e.id === unpublishedId));
});

test("closed-for-voting states reject code requests and ballots with 409", { skip }, async () => {
  const draft = await m.vote.requestVotingCode(voterEmail(1), null);
  assert.equal(draft.status, 409);
  assert.equal((await m.vote.requestVotingCode("early@example.test", null)).status, 409);
  assert.equal(await m.db.prisma.finalistShowcaseEligibleVoter.count({ where: { origin: "PUBLIC" } }), 0);
  assert.equal(draft.deliver, undefined);
  const ballot = await m.vote.submitBallot({ voterId: "f".repeat(24), sid: "x" }, fullBallot(), null);
  assert.equal(ballot.status, 409);
});

test("any email can request a code, and the response never reveals voting status", { skip }, async () => {
  await setState("OPEN");
  const rollMember = await m.vote.requestVotingCode(voterEmail(2), null);
  const stranger = await m.vote.requestVotingCode("stranger@example.test", null);
  const previewRow = await m.vote.requestVotingCode("preview@example.test", null);
  assert.equal(rollMember.status, 200);
  assert.deepEqual(rollMember.body, stranger.body);
  assert.deepEqual(rollMember.body, previewRow.body);
  assert.ok(rollMember.deliver && stranger.deliver && previewRow.deliver);
  const registered = await m.db.prisma.finalistShowcaseEligibleVoter.findUnique({ where: { emailHash: m.vote.emailHash("stranger@example.test") } });
  assert.equal(registered?.origin, "PUBLIC");
  // Case and whitespace do not create a second identity.
  const shouty = await m.vote.requestVotingCode("  STRANGER@example.TEST ", null);
  assert.ok(shouty.deliver);
  assert.equal(await m.db.prisma.finalistShowcaseEligibleVoter.count({ where: { origin: "PUBLIC", emailHash: m.vote.emailHash("stranger@example.test") } }), 1);
  assert.equal((await m.vote.requestVotingCode("not-an-email", null)).status, 400);
});

test("simultaneous first requests for a new email register exactly one voter", { skip }, async () => {
  const email = "racer@example.test";
  const results = await Promise.all(Array.from({ length: 8 }, () => m.vote.requestVotingCode(email, null)));
  assert.ok(results.every((r) => r.status === 200));
  assert.equal(await m.db.prisma.finalistShowcaseEligibleVoter.count({ where: { emailHash: m.vote.emailHash(email) } }), 1);
});

test("a brand-new public email votes once and is then refused", { skip }, async () => {
  const email = "member-of-public@example.test";
  const req = await m.vote.requestVotingCode(email, null);
  const ver = await m.vote.verifyVotingCode(email, req.deliver!.code);
  assert.equal(ver.status, 200);
  const session = m.vote.readVoterSession(ver.token)!;
  assert.equal((await m.vote.submitBallot(session, fullBallot(2), null)).status, 200);
  assert.equal((await m.vote.submitBallot(session, fullBallot(1), null)).status, 409);
  const again = await m.vote.requestVotingCode(email, null);
  assert.equal(again.deliver, undefined);
  assert.deepEqual(again.body, req.body);
});

test("codes are single-use, expire, are superseded, and lock after five wrong guesses", { skip }, async () => {
  const p = m.db.prisma;

  // Reuse.
  const r1 = await m.vote.requestVotingCode(voterEmail(10), null);
  const ok = await m.vote.verifyVotingCode(voterEmail(10), r1.deliver!.code);
  assert.equal(ok.status, 200);
  assert.equal((await m.vote.verifyVotingCode(voterEmail(10), r1.deliver!.code)).status, 400);

  // Superseded by a newer code.
  const old = await m.vote.requestVotingCode(voterEmail(11), null);
  const fresh = await m.vote.requestVotingCode(voterEmail(11), null);
  assert.equal((await m.vote.verifyVotingCode(voterEmail(11), old.deliver!.code)).status, old.deliver!.code === fresh.deliver!.code ? 200 : 400);

  // Expiry.
  const r3 = await m.vote.requestVotingCode(voterEmail(12), null);
  const voter12 = await p.finalistShowcaseEligibleVoter.findUnique({ where: { emailHash: m.vote.emailHash(voterEmail(12)) } });
  await p.finalistShowcaseVerification.updateMany({ where: { voterId: voter12!.id, consumedAt: null }, data: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal((await m.vote.verifyVotingCode(voterEmail(12), r3.deliver!.code)).status, 400);

  // Brute force: five wrong guesses kill the code, even for the right answer afterwards.
  const r4 = await m.vote.requestVotingCode(voterEmail(13), null);
  const wrong = r4.deliver!.code === "000000" ? "111111" : "000000";
  for (let i = 0; i < 5; i += 1) {
    const res = await m.vote.verifyVotingCode(voterEmail(13), wrong);
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { error: m.vote.INVALID_CODE_MESSAGE });
  }
  assert.equal((await m.vote.verifyVotingCode(voterEmail(13), r4.deliver!.code)).status, 400);

  // Ineligible emails get the identical invalid-code answer.
  assert.deepEqual((await m.vote.verifyVotingCode("stranger@example.test", "123456")).body, { error: m.vote.INVALID_CODE_MESSAGE });

  // A forged or foreign session token is rejected.
  assert.equal(m.vote.readVoterSession("not-a-token"), null);
  assert.equal(m.vote.readVoterSession(ok.token!.slice(0, -2) + "xx"), null);
});

test("one voter cannot submit two ballots, even with concurrent requests", { skip }, async () => {
  const session = await verifiedSession(20);
  const results = await Promise.all(Array.from({ length: 12 }, (_, i) => m.vote.submitBallot(session, fullBallot(i), "198.51.100.1")));
  const wins = results.filter((r) => r.status === 200);
  assert.equal(wins.length, 1, `expected one winner, got ${results.map((r) => r.status).join(",")}`);
  assert.ok(results.every((r) => r.status === 200 || r.status === 409));
  const voter = await m.db.prisma.finalistShowcaseEligibleVoter.findUnique({ where: { emailHash: m.vote.emailHash(voterEmail(20)) }, select: { id: true } });
  assert.equal(await m.db.prisma.finalistShowcaseBallot.count({ where: { voterId: voter!.id } }), 1);
  const ballot = await m.db.prisma.finalistShowcaseBallot.findUnique({ where: { voterId: voter!.id }, select: { _count: { select: { votes: true } } } });
  assert.equal(ballot!._count.votes, 3);
  assert.deepEqual(wins[0].body, { ok: true, message: "Your ballot has been recorded." });

  // A fresh verification after voting is told so, and another submit is refused.
  const again = await m.vote.requestVotingCode(voterEmail(20), null);
  assert.equal(again.deliver, undefined);
  assert.equal((await m.vote.submitBallot(session, fullBallot(), null)).status, 409);
});

test("cross-track, unpublished, unknown and incomplete choices are rejected server-side", { skip }, async () => {
  const session = await verifiedSession(30);
  const cases = [
    { ...fullBallot(), SOC_ANALYSIS: ENTRY.ETHICAL_HACKING[0] },
    { ...fullBallot(), SOC_ANALYSIS: unpublishedId },
    { ...fullBallot(), GRC: "0".repeat(24) },
    { SOC_ANALYSIS: ENTRY.SOC_ANALYSIS[0], ETHICAL_HACKING: ENTRY.ETHICAL_HACKING[0] },
    { ...fullBallot(), EXTRA: ENTRY.GRC[0] },
  ];
  for (const c of cases) assert.equal((await m.vote.submitBallot(session, c, null)).status, 400, JSON.stringify(c));
  const voter = await m.db.prisma.finalistShowcaseEligibleVoter.findUnique({ where: { emailHash: m.vote.emailHash(voterEmail(30)) }, select: { id: true } });
  assert.equal(await m.db.prisma.finalistShowcaseBallot.count({ where: { voterId: voter!.id } }), 0);

  // The database itself refuses two votes in one track on one ballot.
  const ballot = await m.db.prisma.finalistShowcaseBallot.create({ data: { voterId: voter!.id, sessionHash: "x" } });
  await assert.rejects(
    m.db.prisma.finalistShowcaseVote.createMany({
      data: [
        { ballotId: ballot.id, entryId: ENTRY.SOC_ANALYSIS[0], track: "SOC_ANALYSIS" },
        { ballotId: ballot.id, entryId: ENTRY.SOC_ANALYSIS[1], track: "SOC_ANALYSIS" },
      ],
    }),
  );
  await m.db.prisma.finalistShowcaseVote.deleteMany({ where: { ballotId: ballot.id } });
  await m.db.prisma.finalistShowcaseBallot.delete({ where: { id: ballot.id } });
});

test("paused, closed and past-deadline voting reject new ballots and keep existing ones", { skip }, async () => {
  const session = await verifiedSession(40);
  const before = await m.db.prisma.finalistShowcaseBallot.count();
  for (const state of ["PAUSED", "CLOSED"] as const) {
    await setState(state);
    const res = await m.vote.submitBallot(session, fullBallot(), null);
    assert.equal(res.status, 409);
    assert.equal(await m.db.prisma.finalistShowcaseBallot.count(), before);
  }
  await setState("OPEN", { closesAt: new Date(Date.now() - 60_000) });
  assert.equal((await m.vote.submitBallot(session, fullBallot(), null)).status, 409);
  await setState("OPEN", { closesAt: null });
  assert.equal((await m.vote.submitBallot(session, fullBallot(), null)).status, 200);
  assert.equal(await m.db.prisma.finalistShowcaseBallot.count(), before + 1);
});

test("admin totals reconcile exactly with stored ballots and votes", { skip }, async () => {
  const expected = new Map<string, number>();
  for (const id of Object.values(ENTRY).flat()) expected.set(id, 0);
  for (const b of await m.db.prisma.finalistShowcaseVote.findMany({ select: { entryId: true } })) expected.set(b.entryId, (expected.get(b.entryId) ?? 0) + 1);

  for (let i = 100; i < 140; i += 1) {
    const session = await verifiedSession(i);
    const choice = fullBallot(i * 7);
    assert.equal((await m.vote.submitBallot(session, choice, null)).status, 200);
    for (const id of Object.values(choice)) expected.set(id, (expected.get(id) ?? 0) + 1);
  }

  const results = await m.admin.getShowcaseResults();
  assert.equal(results.reconciled, true, results.reconcileNotes.join("; "));
  assert.equal(results.completedBallots, await m.db.prisma.finalistShowcaseBallot.count());
  assert.equal(results.rollSize, 506);
  assert.equal(results.remainingEligible, null);
  assert.ok(results.publicVoters >= 3);
  for (const row of results.entries) assert.equal(row.votes, expected.get(row.id) ?? 0, row.finalistName);
  for (const t of m.pub.SHOWCASE_TRACKS) {
    assert.equal(results.votesByTrack[t], results.completedBallots, `${t} should have one vote per ballot`);
    const pct = results.entries.filter((r) => r.track === t).reduce((s, r) => s + r.percentOfTrack, 0);
    assert.ok(Math.abs(pct - 100) < 0.5, `${t} percentages sum to ${pct}`);
  }
  const csv = m.admin.resultsCsv(results);
  assert.match(csv, /"Completed ballots","\d+"/);
});

test("an audited reset removes one ballot and lets that voter vote again", { skip }, async () => {
  const reset = await m.admin.resetBallotByEmail(voterEmail(20));
  assert.equal(reset.ok, true);
  const session = await verifiedSession(20);
  assert.equal((await m.vote.submitBallot(session, fullBallot(1), null)).status, 200);
  assert.equal((await m.admin.resetBallotByEmail("stranger@example.test")).ok, false);
});

test("launch blockers clear only when roll, entries and indexes are all correct", { skip }, async () => {
  assert.deepEqual(await m.admin.launchBlockers(), []);
  await m.db.prisma.finalistShowcaseEntry.update({ where: { id: ENTRY.GRC[0] }, data: { published: false } });
  assert.match((await m.admin.launchBlockers()).join(" "), /GRC has 2 published entries/);
  await m.db.prisma.finalistShowcaseEntry.update({ where: { id: ENTRY.GRC[0] }, data: { published: true } });
});
