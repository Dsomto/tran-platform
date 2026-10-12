import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import type { FinalistShowcaseSettings } from "@/generated/prisma";
import { prisma } from "./db";
import { jwtSecret } from "./secrets";
import {
  ballotShapeError,
  isShowcaseTrack,
  SHOWCASE_KEY,
  type BallotSelections,
  type ShowcaseTrack,
} from "./showcase-public";

// Cohort One showcase voting: verification codes, voter sessions, ballots.
// Every response built here is publication-safe — success or a neutral error,
// never a count.

export const VOTER_COOKIE = "ubi_showcase_voter";
export const SEED_COOKIE = "ubi_showcase_seed";
export const CODE_TTL_MS = 10 * 60_000;
export const MAX_CODE_ATTEMPTS = 5;
export const VOTER_SESSION_SECONDS = 60 * 60;
const VOTER_AUDIENCE = "ubi-showcase-voter";

export const NEUTRAL_CODE_MESSAGE =
  "If that email is on the Cohort One roll and has not voted yet, a six-digit code is on its way. It expires in 10 minutes.";
export const INVALID_CODE_MESSAGE = "That code is not valid or has expired. Request a new code and try again.";
export const BALLOT_RECORDED_MESSAGE = "Your ballot has been recorded.";
export const ALREADY_VOTED_MESSAGE = "A ballot has already been recorded for this email.";

export type ServiceResult = { status: number; body: Record<string, unknown> };

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

// Secret-free and domain-separated so the frozen roll can be snapshotted and
// re-verified from any trusted machine. The raw address already lives in
// PublicApplication; this is an exact-match reference, not a secrecy layer.
export function emailHash(email: string): string {
  return createHash("sha256").update(`ubi-showcase:${SHOWCASE_KEY}:email:v1:${email}`).digest("hex");
}

function serverHmac(label: string, value: string): string {
  return createHmac("sha256", jwtSecret()).update(`showcase:${label}:${value}`).digest("hex");
}

// Abuse signal: a keyed hash of the network, so repeat activity can be
// grouped without storing an IP address.
export function signalHash(ip: string | null | undefined): string | null {
  return ip ? serverHmac("signal", ip).slice(0, 32) : null;
}

function codeHash(voterId: string, code: string): string {
  return serverHmac("code", `${voterId}:${code}`);
}

function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

// ── Settings / voting window ───────────────────────────────────────────────

export type ShowcaseSettingsView = Pick<
  FinalistShowcaseSettings,
  "published" | "votingState" | "opensAt" | "closesAt"
>;

const DEFAULT_SETTINGS: ShowcaseSettingsView = {
  published: false,
  votingState: "DRAFT",
  opensAt: null,
  closesAt: null,
};

export async function getShowcaseSettings(): Promise<ShowcaseSettingsView> {
  const row = await prisma.finalistShowcaseSettings.findUnique({
    where: { key: SHOWCASE_KEY },
    select: { published: true, votingState: true, opensAt: true, closesAt: true },
  });
  return row ?? DEFAULT_SETTINGS;
}

export type VotingPhase = "DRAFT" | "SCHEDULED" | "OPEN" | "PAUSED" | "CLOSED";

export function votingPhase(settings: ShowcaseSettingsView, now = new Date()): VotingPhase {
  if (!settings.published) return "DRAFT";
  if (settings.votingState !== "OPEN") return settings.votingState;
  if (settings.opensAt && now < settings.opensAt) return "SCHEDULED";
  if (settings.closesAt && now >= settings.closesAt) return "CLOSED";
  return "OPEN";
}

const PHASE_MESSAGE: Record<Exclude<VotingPhase, "OPEN">, string> = {
  DRAFT: "Voting has not opened yet.",
  SCHEDULED: "Voting has not opened yet.",
  PAUSED: "Voting is paused. Please check back shortly.",
  CLOSED: "Voting has closed.",
};

async function closedResult(): Promise<ServiceResult | null> {
  const phase = votingPhase(await getShowcaseSettings());
  if (phase === "OPEN") return null;
  return { status: 409, body: { error: PHASE_MESSAGE[phase], phase } };
}

// ── Step 1: request a code ─────────────────────────────────────────────────

export type CodeRequestOutcome = ServiceResult & {
  // Present only when a code was actually issued. The route sends it after
  // the response so eligible and ineligible requests take the same time.
  deliver?: { to: string; code: string };
};

export async function requestVotingCode(rawEmail: unknown, ip: string | null): Promise<CodeRequestOutcome> {
  const closed = await closedResult();
  if (closed) return closed;

  const email = normalizeEmail(rawEmail);
  if (!email) return { status: 400, body: { error: "Enter a valid email address." } };

  const neutral: CodeRequestOutcome = { status: 200, body: { ok: true, message: NEUTRAL_CODE_MESSAGE } };

  const voter = await prisma.finalistShowcaseEligibleVoter.findUnique({
    where: { emailHash: emailHash(email) },
    select: { id: true, ballot: { select: { id: true } } },
  });
  if (!voter || voter.ballot) return neutral;

  const now = new Date();
  // Only the newest code is ever valid.
  await prisma.finalistShowcaseVerification.updateMany({
    where: { voterId: voter.id, consumedAt: null },
    data: { consumedAt: now },
  });
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.finalistShowcaseVerification.create({
    data: {
      voterId: voter.id,
      codeHash: codeHash(voter.id, code),
      expiresAt: new Date(now.getTime() + CODE_TTL_MS),
      // Written explicitly: on MongoDB a `consumedAt: null` filter matches an
      // explicit null but not a missing field.
      consumedAt: null,
      verifiedAt: null,
      signalHash: signalHash(ip),
    },
  });
  return { ...neutral, deliver: { to: email, code } };
}

// ── Step 2: verify the code, issue a voter session ─────────────────────────

export type VoterSession = { voterId: string; sid: string };

export function signVoterSession(voterId: string): { token: string; sid: string } {
  const sid = randomBytes(18).toString("base64url");
  const token = jwt.sign({ sid }, jwtSecret(), {
    subject: voterId,
    audience: VOTER_AUDIENCE,
    expiresIn: VOTER_SESSION_SECONDS,
    algorithm: "HS256",
  });
  return { token, sid };
}

export function readVoterSession(token: string | null | undefined): VoterSession | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, jwtSecret(), {
      algorithms: ["HS256"],
      audience: VOTER_AUDIENCE,
    }) as jwt.JwtPayload;
    if (typeof payload.sub !== "string" || typeof payload.sid !== "string") return null;
    if (!/^[a-f0-9]{24}$/i.test(payload.sub)) return null;
    return { voterId: payload.sub, sid: payload.sid };
  } catch {
    return null;
  }
}

export type VerifyOutcome =
  | { status: 200; body: { ok: true; alreadyVoted: boolean }; token: string }
  | (ServiceResult & { token?: undefined });

export async function verifyVotingCode(rawEmail: unknown, rawCode: unknown): Promise<VerifyOutcome> {
  const closed = await closedResult();
  if (closed) return closed;

  const invalid = { status: 400, body: { error: INVALID_CODE_MESSAGE } };
  const email = normalizeEmail(rawEmail);
  const code = typeof rawCode === "string" ? rawCode.replace(/\s+/g, "") : "";
  if (!email || !/^\d{6}$/.test(code)) return invalid;

  const voter = await prisma.finalistShowcaseEligibleVoter.findUnique({
    where: { emailHash: emailHash(email) },
    select: { id: true, ballot: { select: { id: true } } },
  });
  if (!voter) return invalid;

  const now = new Date();
  const pending = await prisma.finalistShowcaseVerification.findFirst({
    where: { voterId: voter.id, consumedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
    select: { id: true, codeHash: true, failedAttempts: true },
  });
  if (!pending || pending.failedAttempts >= MAX_CODE_ATTEMPTS) return invalid;

  if (!sameHash(pending.codeHash, codeHash(voter.id, code))) {
    const attempts = pending.failedAttempts + 1;
    await prisma.finalistShowcaseVerification.updateMany({
      where: { id: pending.id, consumedAt: null },
      data: {
        failedAttempts: { increment: 1 },
        ...(attempts >= MAX_CODE_ATTEMPTS ? { consumedAt: now } : {}),
      },
    });
    return invalid;
  }

  // Single use: only one concurrent request can flip consumedAt from null.
  const claimed = await prisma.finalistShowcaseVerification.updateMany({
    where: { id: pending.id, consumedAt: null, failedAttempts: { lt: MAX_CODE_ATTEMPTS } },
    data: { consumedAt: now, verifiedAt: now },
  });
  if (claimed.count !== 1) return invalid;

  const { token } = signVoterSession(voter.id);
  return { status: 200, body: { ok: true, alreadyVoted: Boolean(voter.ballot) }, token };
}

// ── Step 3: submit the ballot ──────────────────────────────────────────────

function isUniqueViolation(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return code === "P2002" || code === "P2034";
}

export async function submitBallot(
  session: VoterSession | null,
  selections: unknown,
  ip: string | null,
): Promise<ServiceResult> {
  if (!session) {
    return { status: 401, body: { error: "Confirm your email before submitting a ballot." } };
  }
  const closed = await closedResult();
  if (closed) return closed;

  const shapeError = ballotShapeError(selections);
  if (shapeError) return { status: 400, body: { error: shapeError } };
  const chosen = Object.entries(selections as BallotSelections).filter(
    (pair): pair is [ShowcaseTrack, string] => isShowcaseTrack(pair[0]) && typeof pair[1] === "string",
  );

  const voter = await prisma.finalistShowcaseEligibleVoter.findUnique({
    where: { id: session.voterId },
    select: { id: true, ballot: { select: { id: true } } },
  });
  if (!voter) return { status: 401, body: { error: "Confirm your email before submitting a ballot." } };
  if (voter.ballot) return { status: 409, body: { error: ALREADY_VOTED_MESSAGE, alreadyVoted: true } };

  const entries = await prisma.finalistShowcaseEntry.findMany({
    where: { id: { in: chosen.map(([, id]) => id) }, published: true },
    select: { id: true, track: true },
  });
  const byId = new Map(entries.map((e) => [e.id, e.track]));
  for (const [track, entryId] of chosen) {
    if (byId.get(entryId) !== track) {
      return { status: 400, body: { error: "One of those projects is not available on the ballot. Refresh the page and choose again." } };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const ballot = await tx.finalistShowcaseBallot.create({
        data: {
          voterId: voter.id,
          sessionHash: createHash("sha256").update(session.sid).digest("hex"),
          signalHash: signalHash(ip),
        },
        select: { id: true },
      });
      await tx.finalistShowcaseVote.createMany({
        data: chosen.map(([track, entryId]) => ({ ballotId: ballot.id, entryId, track })),
      });
    });
  } catch (err) {
    // A concurrent ballot for the same voter loses on the unique voterId index
    // (or as a transaction write conflict). Either way exactly one survives.
    const winner = await prisma.finalistShowcaseBallot.findUnique({
      where: { voterId: voter.id },
      select: { id: true },
    });
    if (winner || isUniqueViolation(err)) {
      return { status: 409, body: { error: ALREADY_VOTED_MESSAGE, alreadyVoted: true } };
    }
    throw err;
  }

  return { status: 200, body: { ok: true, message: BALLOT_RECORDED_MESSAGE } };
}

export async function voterHasBallot(session: VoterSession | null): Promise<boolean> {
  if (!session) return false;
  const ballot = await prisma.finalistShowcaseBallot.findUnique({
    where: { voterId: session.voterId },
    select: { id: true },
  });
  return Boolean(ballot);
}

export function renderVotingCodeEmail(code: string): { subject: string; html: string } {
  return {
    subject: `${code} is your UBI Cohort One showcase voting code`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;padding:28px 16px;color:#0F172A;">
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#0F766E;font-weight:700;">Ubuntu Bridge Initiative</p>
        <h1 style="margin:0 0 16px;font-size:20px;">Cohort One Finalist Showcase</h1>
        <p style="margin:0 0 16px;line-height:1.55;">Use this code to confirm your email and submit your ballot. It expires in 10 minutes and works once.</p>
        <p style="margin:0 0 16px;font-size:30px;letter-spacing:8px;font-weight:700;font-family:'SF Mono',Consolas,monospace;background:#F1F5F9;border:1px solid #CBD5E1;padding:14px 18px;display:inline-block;">${code}</p>
        <p style="margin:0;line-height:1.55;color:#475569;font-size:13px;">If you did not ask for this code, ignore this email. No ballot is recorded without it.</p>
      </div>`,
  };
}
