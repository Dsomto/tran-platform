import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ScholarshipReview } from "./scholarship-review";

export default async function ScholarshipsPage() {
  await requireAdmin();

  const applications = await prisma.dataScholarshipApplication.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <ScholarshipReview
      applications={applications.map((a) => ({
        id: a.id,
        fullName: a.fullName,
        email: a.email,
        phone: a.phone,
        country: a.country,
        internCode: a.internCode,
        currentStage: a.currentStage,
        dataSituation: a.dataSituation,
        reason: a.reason,
        referralSource: a.referralSource,
        status: a.status,
        reviewNotes: a.reviewNotes,
        reviewedAt: a.reviewedAt ? a.reviewedAt.toISOString() : null,
        createdAt: a.createdAt.toISOString(),
      }))}
    />
  );
}
