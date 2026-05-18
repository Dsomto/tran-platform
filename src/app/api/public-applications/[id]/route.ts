import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET a single public application's full detail — used by the admin
// "preview application" view. Admin / super-admin only. loginPassword and
// other minted-account fields are deliberately excluded.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const application = await prisma.publicApplication.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      country: true,
      ageRange: true,
      gender: true,
      currentStatus: true,
      experience: true,
      trackInterest: true,
      dedication: true,
      goals: true,
      whyPickYou: true,
      referralSource: true,
      status: true,
      stage: true,
      stageStatus: true,
      internId: true,
      createdAt: true,
      welcomeEmailSentAt: true,
      rejectionEmailSentAt: true,
    },
  });

  if (!application) {
    return Response.json({ error: "Application not found" }, { status: 404 });
  }

  return Response.json({ application });
}
