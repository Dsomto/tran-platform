import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/auth";
import { rateLimit, rateLimitResponse, getClientKey, RATE_LIMITS } from "@/lib/rate-limit";

const STR = (v: unknown, max = 4000): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t.slice(0, max);
};
const INT = (v: unknown, lo: number, hi: number): number | null => {
  if (typeof v !== "number" || Number.isNaN(v)) return null;
  const n = Math.round(v);
  return n < lo || n > hi ? null : n;
};

// Accepts a programme-outcomes feedback response. Three entry points:
//  - public tokenized form (body.token present, no session) — links to the invite
//  - in-dashboard form (logged-in intern, no token) — identity from session
//  - open public form (/feedback) — no token, no session, self-reported identity
//
// FeedbackResponse.inviteId carries a plain unique index in MongoDB, which
// treats null as a value: a second row with inviteId=null is rejected with a
// duplicate-key error. So every response must carry a *distinct* inviteId. When
// we have no invite we mint one from the submitter's email, which keeps the
// row unique, keeps it attributable, and preserves one-response-per-person.
export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimit(getClientKey(request), RATE_LIMITS.publicForm);
    if (!rl.ok) return rateLimitResponse(rl);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Invalid request." }, { status: 400 });
    }

    const session = await getSession();

    // Resolve the invite (if any) and the identity we attach to the response.
    let inviteId: string | null = null;
    let name = STR(body.name, 200);
    let email = STR(body.email, 200);

    if (typeof body.token === "string" && body.token.trim()) {
      const invite = await prisma.feedbackInvite.findUnique({
        where: { token: body.token.trim() },
        include: { response: true },
      });
      if (!invite) {
        return Response.json({ error: "This feedback link is not valid." }, { status: 404 });
      }
      if (invite.respondedAt || invite.response) {
        return Response.json({ error: "You have already responded." }, { status: 409 });
      }
      inviteId = invite.id;
      name = name ?? invite.name;
      email = email ?? invite.email;
    } else if (session) {
      // Logged-in intern submitting their own feedback. Match an invite by email
      // if one exists so it folds into the same record / analytics segmentation.
      name = name ?? `${session.firstName} ${session.lastName}`.trim();
      email = email ?? session.email;
      const invite = await prisma.feedbackInvite.findFirst({
        where: { email: session.email.toLowerCase() },
        include: { response: true },
      });
      if (invite) {
        if (invite.respondedAt || invite.response) {
          return Response.json({ error: "You have already responded." }, { status: 409 });
        }
        inviteId = invite.id;
      }
    }
    // No invite yet: the open public form, or a logged-in intern who was never
    // invited. Mint an invite so this row gets a distinct, non-null inviteId.
    // Without this, Mongo's unique index rejects the second such submission.
    if (!inviteId) {
      if (!email) {
        return Response.json({ error: "Your email is required." }, { status: 400 });
      }
      const lowerEmail = email.toLowerCase();
      const existing = await prisma.feedbackInvite.findFirst({
        where: { email: lowerEmail },
        include: { response: true },
      });
      if (existing) {
        if (existing.respondedAt || existing.response) {
          return Response.json({ error: "You have already responded." }, { status: 409 });
        }
        inviteId = existing.id;
      } else {
        const minted = await prisma.feedbackInvite.create({
          data: { token: randomUUID(), email: lowerEmail, name: name ?? null },
        });
        inviteId = minted.id;
      }
    }

    const data = {
      inviteId,
      name,
      email: email ? email.toLowerCase() : null,
      employmentStatus: STR(body.employmentStatus, 40),
      roleTitle: STR(body.roleTitle, 200),
      employer: STR(body.employer, 200),
      salaryBand: STR(body.salaryBand, 40),
      timeToHire: STR(body.timeToHire, 40),
      programmeHelped: STR(body.programmeHelped, 20),
      npsScore: INT(body.npsScore, 0, 10),
      wouldRecommend: STR(body.wouldRecommend, 20),
      confidenceBefore: INT(body.confidenceBefore, 1, 5),
      confidenceAfter: INT(body.confidenceAfter, 1, 5),
      mostHelpful: STR(body.mostHelpful),
      biggestChallenge: STR(body.biggestChallenge),
      howToImprove: STR(body.howToImprove),
      skillsGained: Array.isArray(body.skillsGained)
        ? body.skillsGained.filter((s: unknown) => typeof s === "string").slice(0, 30)
        : [],
      testimonial: STR(body.testimonial),
      consentToShare: body.consentToShare === true,
      feedbackProgrammeHead: STR(body.feedbackProgrammeHead),
      feedbackCoFounder: STR(body.feedbackCoFounder),
      feedbackProgrammeManager: STR(body.feedbackProgrammeManager),
      whereWorkGoal: STR(body.whereWorkGoal),
      supportNeeded: STR(body.supportNeeded),
      country: STR(body.country, 120),
      gender: STR(body.gender, 40),
      ageRange: STR(body.ageRange, 40),
      employmentBefore: STR(body.employmentBefore, 40),
    };

    await prisma.$transaction(async (tx) => {
      await tx.feedbackResponse.create({ data });
      if (inviteId) {
        await tx.feedbackInvite.update({
          where: { id: inviteId },
          data: { respondedAt: new Date() },
        });
      }
    });

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    logger.error("feedback_submit_failed", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
