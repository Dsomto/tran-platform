import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { randomBytes } from "node:crypto";
import { getSession } from "@/lib/auth";
import { loadPublicEntries } from "@/lib/showcase-entries";
import { BALLOT_RULE, orderForViewer, PUBLIC_ENTRY_KEYS, type PublicShowcaseEntry } from "@/lib/showcase-public";
import {
  getShowcaseSettings,
  readVoterSession,
  SEED_COOKIE,
  voterHasBallot,
  votingPhase,
  VOTER_COOKIE,
} from "@/lib/showcase-vote";
import { ShowcaseExperience } from "./showcase-experience";

export const dynamic = "force-dynamic";

// One generic card for the whole showcase. No per-finalist metadata exists,
// so no link can become a candidate-specific campaign card.
export const metadata: Metadata = {
  title: "Cohort One Finalist Showcase",
  description:
    "Ten finalists, three tracks. Watch the Cohort One finalists of the Ubuntu Bridge Initiative cybersecurity programme explain what they built.",
  alternates: { canonical: "/showcase/cohort-one" },
  openGraph: {
    title: "UBI Cohort One Finalist Showcase",
    description: "Ten finalists, three tracks. Built under pressure. Explained in two minutes.",
    url: "/showcase/cohort-one",
    images: [{ url: "/images/programs/workshops.jpg", width: 1920, height: 1080, alt: "A UBI community cybersecurity workshop" }],
  },
};

// Copy only the allow-listed public keys, so nothing else can ride along
// into the client payload.
function publicOnly(entry: PublicShowcaseEntry): PublicShowcaseEntry {
  return Object.fromEntries(PUBLIC_ENTRY_KEYS.map((k) => [k, entry[k]])) as PublicShowcaseEntry;
}

export default async function CohortOneShowcasePage() {
  const [settings, session, jar] = await Promise.all([getShowcaseSettings(), getSession(), cookies()]);
  const isAdmin = session?.role === "ADMIN" || session?.role === "SUPER_ADMIN";
  if (!settings.published && !isAdmin) notFound();

  const seedCookie = jar.get(SEED_COOKIE)?.value;
  const seed = seedCookie && /^[A-Za-z0-9_-]{16,64}$/.test(seedCookie) ? seedCookie : randomBytes(16).toString("base64url");
  const entries = orderForViewer(await loadPublicEntries(), seed).map(publicOnly);

  const voter = readVoterSession(jar.get(VOTER_COOKIE)?.value);
  const voted = await voterHasBallot(voter);

  return (
    <ShowcaseExperience
      entries={entries}
      phase={votingPhase(settings)}
      closesAt={settings.closesAt?.toISOString() ?? null}
      rule={BALLOT_RULE}
      seed={seed}
      persistSeed={!seedCookie}
      voterState={voted ? "voted" : voter ? "verified" : "anonymous"}
      adminPreview={isAdmin && !settings.published}
    />
  );
}
