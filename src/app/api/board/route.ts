import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stage = searchParams.get("stage");
  const search = searchParams.get("search") || "";

  // Only show accepted applicants who are active or advanced (not eliminated)
  const where: Record<string, unknown> = {
    status: "approved",
    stageStatus: { in: ["active", "advanced"] },
  };

  if (stage !== null && stage !== "") {
    where.stage = parseInt(stage);
  }

  if (search) {
    where.fullName = { contains: search, mode: "insensitive" };
  }

  const applicants = await prisma.publicApplication.findMany({
    where,
    select: {
      fullName: true,
      country: true,
      trackInterest: true,
      stage: true,
      stageStatus: true,
    },
    orderBy: [{ stage: "desc" }, { fullName: "asc" }],
  });

  // Stage counts
  const stageCounts: Record<number, number> = {};
  for (const app of applicants) {
    stageCounts[app.stage] = (stageCounts[app.stage] || 0) + 1;
  }

  return Response.json({
    applicants,
    stageCounts,
    total: applicants.length,
  });
}
