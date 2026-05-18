import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { scoreApplication } from "@/lib/applicant-score";
import snapshot from "@/data/recommended-snapshot.json";

// The "Recommended" tab.
//
// Ranking comes from a one-time review pass: 20 agents read every pending
// application against one identical rubric (real hands-on work, genuine
// personal writing, emerging-not-expert, committed). Their scores + written
// reasons are frozen in src/data/recommended-snapshot.json.
//
// At request time we only ever show applicants who are STILL pending, ranked
// by their snapshot score. An application created AFTER the snapshot won't be
// in it — those fall back to the transparent heuristic in lib/applicant-score
// so they are still ranked rather than dropped.
//
// To refresh after a new wave of applications:
//   npx tsx scripts/dump-applications-for-review.ts   (read-only dump)
//   ...run the review agents on the chunks...
//   npx tsx scripts/merge-recommendations.ts          (rewrites the snapshot)
//
// READ-ONLY — this route writes nothing; the admin still makes every decision.
//
// GET ?page=&limit=  → one ranked page; each row carries _score and _reasons.
// GET ?ids=1         → the ids of the whole ranked top list ("Approve all").

const TARGET = 500;

type SnapRow = { id: string; score: number; reasons: string };
const scoreMap = new Map<string, SnapRow>(
  (snapshot.ranked as SnapRow[]).map((r) => [r.id, r])
);

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const wantIds = searchParams.get("ids") === "1";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

  const pending = await prisma.publicApplication.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
  });

  const ranked = pending
    .map((a) => {
      const snap = scoreMap.get(a.id);
      if (snap) {
        return { ...a, _score: snap.score, _reasons: [snap.reasons] };
      }
      // Applied after the review pass — score it with the heuristic so it is
      // still ranked. Re-run the review pass to give it a full agent read.
      const h = scoreApplication(a);
      return { ...a, _score: h.score, _reasons: h.reasons };
    })
    .sort((x, y) => y._score - x._score)
    .slice(0, TARGET);

  if (wantIds) {
    return Response.json({ ids: ranked.map((a) => a.id), total: ranked.length });
  }

  const total = ranked.length;
  const skip = (page - 1) * limit;
  return Response.json({
    applications: ranked.slice(skip, skip + limit),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}

export const maxDuration = 60;
