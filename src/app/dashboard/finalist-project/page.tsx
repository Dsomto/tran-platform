import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FinalistProjectForm } from "./finalist-project-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FinalistProjectPage() {
  const session = await requireAuth();
  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
    select: {
      id: true,
      finalist: true,
      isActive: true,
      track: true,
      finalistProject: {
        select: {
          projectTitle: true,
          projectSummary: true,
          projectUrl: true,
          videoUrl: true,
          publicationConsent: true,
          submittedAt: true,
        },
      },
    },
  });

  if (!intern?.isActive || !intern.finalist) redirect("/dashboard");

  return (
    <FinalistProjectForm
      firstName={session.firstName}
      lastName={session.lastName}
      avatarUrl={session.avatarUrl}
      track={intern.track}
      initial={intern.finalistProject ? {
        ...intern.finalistProject,
        submittedAt: intern.finalistProject.submittedAt.toISOString(),
      } : null}
    />
  );
}
