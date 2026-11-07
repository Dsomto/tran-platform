import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VolunteerReview } from "./volunteer-review";

export default async function VolunteersAdminPage() {
  await requireAdmin();

  const applications = await prisma.volunteerApplication.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <VolunteerReview
      applications={applications.map((application) => ({
        ...application,
        createdAt: application.createdAt.toISOString(),
        updatedAt: application.updatedAt.toISOString(),
        reviewedAt: application.reviewedAt?.toISOString() ?? null,
      }))}
    />
  );
}
