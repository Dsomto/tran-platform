import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSuperAdmin } from "@/lib/api-auth";
import { recordAudit, auditMetaFromRequest } from "@/lib/audit";
import { logger } from "@/lib/logger";

// Reset the leaderboard. Sets Intern.points = 0 for everyone and zeros
// Team.totalPoints. PointLog history is preserved (audit trail) so we can
// reconstruct who-earned-what later if needed.
//
// Use when starting a new stage and you want fresh ranking. Super-admin
// only — recorded to AuditLog.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiSuperAdmin();
    if (auth.response) return auth.response;
    const admin = auth.session;

    const internsBefore = await prisma.intern.count({ where: { points: { gt: 0 } } });
    const teamsBefore = await prisma.team.count({ where: { totalPoints: { gt: 0 } } });

    const [internRes, teamRes] = await Promise.all([
      prisma.intern.updateMany({ data: { points: 0 } }),
      prisma.team.updateMany({ data: { totalPoints: 0 } }),
    ]);

    await recordAudit({
      actor: admin,
      action: "leaderboard.reset",
      targetType: "STAGE_RESULTS",
      targetId: "leaderboard",
      details: {
        internsResetCount: internRes.count,
        teamsResetCount: teamRes.count,
        internsWithPointsBefore: internsBefore,
        teamsWithPointsBefore: teamsBefore,
      },
      ...auditMetaFromRequest(request),
    });

    return Response.json({
      ok: true,
      internsReset: internRes.count,
      teamsReset: teamRes.count,
      internsWithPointsBefore: internsBefore,
      teamsWithPointsBefore: teamsBefore,
    });
  } catch (error) {
    logger.error("leaderboard_reset_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
