import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ids, action } = await request.json();

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return Response.json({ error: "No applicant IDs provided." }, { status: 400 });
  }

  if (!action || !["advance", "eliminate"].includes(action)) {
    return Response.json(
      { error: "Invalid action. Must be 'advance' or 'eliminate'." },
      { status: 400 }
    );
  }

  if (action === "eliminate") {
    const result = await prisma.publicApplication.updateMany({
      where: { id: { in: ids }, stageStatus: "active" },
      data: { stageStatus: "eliminated" },
    });
    return Response.json({ success: true, updated: result.count });
  }

  // Advance: group by current stage so each updateMany is a single DB op.
  const applicants = await prisma.publicApplication.findMany({
    where: { id: { in: ids }, stageStatus: "active", stage: { lt: 10 } },
    select: { id: true, stage: true },
  });

  const byStage = new Map<number, string[]>();
  for (const a of applicants) {
    const bucket = byStage.get(a.stage) ?? [];
    bucket.push(a.id);
    byStage.set(a.stage, bucket);
  }

  // One updateMany per distinct current stage. No $transaction wrapper: Prisma
  // + MongoDB transactions need a replica set, and cross-group atomicity isn't
  // required here — each group is independent.
  const results = await Promise.all(
    Array.from(byStage.entries()).map(([stage, groupIds]) => {
      const nextStage = stage + 1;
      return prisma.publicApplication.updateMany({
        where: { id: { in: groupIds }, stageStatus: "active", stage },
        data: {
          stage: nextStage,
          stageStatus: nextStage === 10 ? "advanced" : "active",
        },
      });
    })
  );

  const advanced = results.reduce((sum, r) => sum + r.count, 0);
  return Response.json({ success: true, updated: advanced });
}
