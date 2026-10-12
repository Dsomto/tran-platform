import { prisma } from "./db";
import { emailHash, normalizeEmail } from "./showcase-vote";
import {
  displayName,
  driveEmbedUrl,
  driveOpenUrl,
  driveThumbnailUrl,
  EXPECTED_ENTRY_COUNT,
  EXPECTED_ROLL_SIZE,
  isShowcaseTrack,
  safePublicUrl,
  SHOWCASE_TRACKS,
  showcaseSlug,
  type PublicShowcaseEntry,
  type ShowcaseTrack,
} from "./showcase-public";

// The finalist source of truth, exactly as the brief defines it.
export const FINALIST_WHERE = {
  finalist: true,
  isActive: true,
  currentStage: "STAGE_9",
} as const;

// Public read. Selects publication fields only — votes are not joined, so
// they cannot leak through this path even by mistake.
export async function loadPublicEntries(): Promise<PublicShowcaseEntry[]> {
  const rows = await prisma.finalistShowcaseEntry.findMany({
    where: {
      published: true,
      submission: { is: { publicationConsent: true, intern: { is: FINALIST_WHERE } } },
    },
    select: {
      id: true,
      slug: true,
      track: true,
      reviewedProjectUrl: true,
      reviewedVideoUrl: true,
      submission: {
        select: {
          projectTitle: true,
          projectSummary: true,
          projectUrl: true,
          videoUrl: true,
          intern: { select: { user: { select: { firstName: true, lastName: true } } } },
        },
      },
    },
  });

  return rows.flatMap((row): PublicShowcaseEntry[] => {
    if (!isShowcaseTrack(row.track)) return [];
    const s = row.submission;
    const video = row.reviewedVideoUrl ?? s.videoUrl;
    return [
      {
        id: row.id,
        slug: row.slug,
        track: row.track,
        finalistName: displayName(s.intern.user.firstName, s.intern.user.lastName),
        projectTitle: s.projectTitle.trim(),
        projectSummary: s.projectSummary.trim(),
        projectUrl: safePublicUrl(row.reviewedProjectUrl ?? s.projectUrl),
        videoEmbedUrl: driveEmbedUrl(video),
        videoOpenUrl: driveOpenUrl(video),
        thumbnailUrl: driveThumbnailUrl(video),
      },
    ];
  });
}

// ── Read-only seeding plans. Each fails closed on any mismatch. ────────────

export type EntryPlan = { submissionId: string; slug: string; track: ShowcaseTrack; label: string };

export async function planShowcaseEntries(): Promise<EntryPlan[]> {
  const finalists = await prisma.intern.findMany({
    where: FINALIST_WHERE,
    select: {
      track: true,
      user: { select: { firstName: true, lastName: true } },
      finalistProject: { select: { id: true, projectTitle: true, publicationConsent: true } },
    },
  });

  const plan: EntryPlan[] = [];
  for (const f of finalists) {
    const sub = f.finalistProject;
    if (!sub || !sub.publicationConsent || !isShowcaseTrack(f.track)) continue;
    const name = displayName(f.user.firstName, f.user.lastName);
    plan.push({ submissionId: sub.id, slug: showcaseSlug(name, sub.projectTitle), track: f.track, label: `${name} — ${sub.projectTitle}` });
  }

  const problems: string[] = [];
  for (const track of SHOWCASE_TRACKS) {
    const n = plan.filter((p) => p.track === track).length;
    if (n !== EXPECTED_ENTRY_COUNT[track]) problems.push(`${track}: expected ${EXPECTED_ENTRY_COUNT[track]}, found ${n}`);
  }
  if (new Set(plan.map((p) => p.slug)).size !== plan.length) problems.push("duplicate slugs");
  if (problems.length > 0) throw new Error(`Showcase entry plan failed closed: ${problems.join("; ")}`);
  return plan;
}

export type RollPlan = { publicApplicationId: string; emailHash: string }[];

// The reunion-campaign audience: credentials email sent, not a preview row.
export async function planVoterRoll(): Promise<RollPlan> {
  const rows = await prisma.publicApplication.findMany({
    where: { credentialsEmailSentAt: { not: null }, NOT: { status: "preview" } },
    select: { id: true, email: true },
  });
  const seen = new Map<string, string>();
  let invalid = 0;
  for (const row of rows) {
    const email = normalizeEmail(row.email);
    if (!email) { invalid += 1; continue; }
    if (!seen.has(email)) seen.set(email, row.id);
  }
  if (invalid > 0 || seen.size !== EXPECTED_ROLL_SIZE) {
    throw new Error(
      `Voter roll failed closed: ${rows.length} rows, ${seen.size} unique valid emails, ${invalid} invalid (expected exactly ${EXPECTED_ROLL_SIZE}).`,
    );
  }
  return [...seen.entries()].map(([email, publicApplicationId]) => ({ publicApplicationId, emailHash: emailHash(email) }));
}
