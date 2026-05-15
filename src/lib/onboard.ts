import { prisma } from "./db";
import { hashPassword } from "./auth";
import { Track } from "@/generated/prisma";

// The fields onboarding actually needs. A full PublicApplication satisfies
// this, so existing callers still type-check — but the welcome-email commit
// path can also pass a freshly-built object without loading the whole row.
type OnboardInput = {
  email: string;
  fullName: string;
  trackInterest: string;
  loginPassword: string | null;
};

function mapTrack(trackInterest: string): Track {
  const s = trackInterest.toLowerCase();
  if (s.includes("soc")) return Track.SOC_ANALYSIS;
  if (s.includes("ethical") || s.includes("hack") || s.includes("pen")) return Track.ETHICAL_HACKING;
  if (s.includes("grc") || s.includes("govern") || s.includes("complian")) return Track.GRC;
  return Track.SOC_ANALYSIS;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/**
 * Idempotent: turns an approved PublicApplication into a User + Intern pair.
 * If a User with this email already exists, attaches an Intern to it; else
 * creates both. Prisma on MongoDB can't chain on freshly-created IDs inside
 * a $transaction array, so we serialize — user creation is guarded by
 * findUnique first, so a retry after a partial failure still converges.
 */
export async function onboardApprovedApplicant(app: OnboardInput): Promise<{
  userId: string;
  internDbId: string;
  wasExisting: boolean;
}> {
  if (!app.loginPassword) {
    throw new Error("Cannot onboard applicant without a loginPassword");
  }

  const email = app.email.toLowerCase().trim();
  const { firstName, lastName } = splitName(app.fullName);
  const track = mapTrack(app.trackInterest);

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { intern: true },
  });

  if (existing) {
    // Reuse the account — but reset the password to the one we are about to
    // email. The welcome email ships `app.loginPassword` as the temp password,
    // so the stored hash MUST match it or the new intern can't log in. (This
    // also makes a retry after a partial failure converge: the second attempt
    // generates a fresh password and this keeps the stored hash in sync.)
    const intern =
      existing.intern ??
      (await prisma.intern.create({ data: { userId: existing.id, track } }));
    await prisma.user.update({
      where: { id: existing.id },
      data: { password: await hashPassword(app.loginPassword) },
    });
    return { userId: existing.id, internDbId: intern.id, wasExisting: true };
  }

  const passwordHash = await hashPassword(app.loginPassword);
  const user = await prisma.user.create({
    data: { email, password: passwordHash, firstName, lastName, role: "INTERN" },
  });
  const intern = await prisma.intern.create({ data: { userId: user.id, track } });
  return { userId: user.id, internDbId: intern.id, wasExisting: false };
}
