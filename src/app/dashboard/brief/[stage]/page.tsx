import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STAGE_BRIEFS } from "@/lib/stage-briefs";
import { STAGE_SLUG_TO_ENUM, type StageSlug } from "@/lib/stage-login";
import { BriefPrintView } from "./brief-print-view";

const VALID: StageSlug[] = ["stage-0", "stage-1", "stage-2", "stage-3", "stage-4"];

function isStageSlug(s: string): s is StageSlug {
  return (VALID as string[]).includes(s);
}

export default async function StageBriefPrintPage({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { stage: rawSlug } = await params;
  if (!isStageSlug(rawSlug)) notFound();

  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
    select: { id: true, currentStage: true, isActive: true },
  });
  if (!intern || !intern.isActive) redirect("/dashboard");

  const enumKey = STAGE_SLUG_TO_ENUM[rawSlug];
  const brief = STAGE_BRIEFS[enumKey];
  if (!brief) notFound();

  const internCode = await prisma.publicApplication
    .findFirst({
      where: { email: session.email.toLowerCase() },
      select: { internId: true },
    })
    .then((p) => p?.internId ?? "UBI-?");

  return (
    <BriefPrintView
      brief={brief}
      internCode={internCode}
      issuedAt={new Date().toISOString()}
    />
  );
}
