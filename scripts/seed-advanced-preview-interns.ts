import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { Role, Stage, Track } from "../src/generated/prisma";

const password = process.env.PREVIEW_PASSWORD ?? "";
const commit = process.env.COMMIT === "1";

if (!password || password.length < 12) {
  throw new Error("PREVIEW_PASSWORD must be at least 12 characters.");
}

const previews = [
  {
    email: "advanced-preview-soc@netforge.invalid",
    firstName: "SOC",
    lastName: "Preview",
    code: "UBI-2099-9001",
    track: Track.SOC_ANALYSIS,
  },
  {
    email: "advanced-preview-ethical@netforge.invalid",
    firstName: "Ethical",
    lastName: "Preview",
    code: "UBI-2099-9002",
    track: Track.ETHICAL_HACKING,
  },
  {
    email: "advanced-preview-grc@netforge.invalid",
    firstName: "GRC",
    lastName: "Preview",
    code: "UBI-2099-9003",
    track: Track.GRC,
  },
] as const;

async function main() {
  console.log(`Mode: ${commit ? "COMMIT" : "DRY RUN"}`);
  for (const preview of previews) {
    console.log(`${commit ? "UPSERT" : "WOULD UPSERT"} ${preview.email} -> ${preview.track} / STAGE_5`);
  }
  if (!commit) return;

  const passwordHash = await bcrypt.hash(password, 12);
  for (const preview of previews) {
    await prisma.$transaction(async (tx) => {
      const existingApp = await tx.publicApplication.findUnique({
        where: { email: preview.email },
        select: { status: true },
      });
      if (existingApp && existingApp.status !== "preview") {
        throw new Error(`Refusing to replace non-preview application ${preview.email}.`);
      }

      const user = await tx.user.upsert({
        where: { email: preview.email },
        create: {
          email: preview.email,
          password: passwordHash,
          firstName: preview.firstName,
          lastName: preview.lastName,
          role: Role.INTERN,
        },
        update: {
          password: passwordHash,
          firstName: preview.firstName,
          lastName: preview.lastName,
          role: Role.INTERN,
          failedLoginCount: 0,
          lockedUntil: null,
          tokenVersion: { increment: 1 },
        },
      });

      await tx.intern.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          currentStage: Stage.STAGE_5,
          track: preview.track,
          isActive: true,
          ndaSignedAt: new Date(),
          ndaSignedName: `${preview.firstName} ${preview.lastName}`,
        },
        update: {
          currentStage: Stage.STAGE_5,
          track: preview.track,
          isActive: true,
          eliminatedAt: null,
          archivedAt: null,
          ndaSignedAt: new Date(),
          ndaSignedName: `${preview.firstName} ${preview.lastName}`,
        },
      });

      await tx.publicApplication.upsert({
        where: { email: preview.email },
        create: {
          fullName: `${preview.firstName} ${preview.lastName}`,
          email: preview.email,
          country: "Simulation",
          ageRange: "N/A",
          currentStatus: "Advanced-stage launch simulation",
          experience: "Preview account",
          trackInterest: preview.track,
          dedication: "Preview only",
          goals: "Validate the intern experience",
          status: "preview",
          stage: 5,
          stageStatus: "preview",
          internId: preview.code,
          loginPassword: null,
        },
        update: {
          fullName: `${preview.firstName} ${preview.lastName}`,
          trackInterest: preview.track,
          status: "preview",
          stage: 5,
          stageStatus: "preview",
          internId: preview.code,
          loginPassword: null,
        },
      });
    }, { maxWait: 10_000, timeout: 30_000 });
  }

  console.log("Advanced preview accounts are ready.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
