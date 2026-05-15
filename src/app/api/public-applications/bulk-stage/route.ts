import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { syncApplicantStages } from "@/lib/applicant-stage";

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
    // Snapshot who is actually being eliminated (active only) before the
    // updateMany, so we can mirror the change onto their Intern rows + queue
    // the elimination emails.
    const affected = await prisma.publicApplication.findMany({
      where: { id: { in: ids }, stageStatus: "active" },
      select: { id: true, email: true, fullName: true, stage: true },
    });
    const result = await prisma.publicApplication.updateMany({
      where: { id: { in: affected.map((a) => a.id) }, stageStatus: "active" },
      data: { stageStatus: "eliminated" },
    });
    await syncApplicantStages(affected, "eliminate");
    return Response.json({ success: true, updated: result.count });
  }

  // Advance: group by current stage so each updateMany is a single DB op.
  const applicants = await prisma.publicApplication.findMany({
    where: { id: { in: ids }, stageStatus: "active", stage: { lt: 10 } },
    select: { id: true, email: true, fullName: true, stage: true },
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

  // Mirror the advance onto the backing Intern rows + queue the stage-passed
  // emails. `stage + 1` is the new stage each applicant just moved to.
  await syncApplicantStages(
    applicants.map((a) => ({
      id: a.id,
      email: a.email,
      fullName: a.fullName,
      stage: a.stage + 1,
    })),
    "advance"
  );

  return Response.json({ success: true, updated: advanced });
}

// Bulk stage advance: explicit timeout budget for large cohorts.
export const maxDuration = 120;
