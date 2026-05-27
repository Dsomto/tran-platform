import { prisma } from "@/lib/db";
import { TaskKind, type Stage } from "@/generated/prisma";

// Auto-graded ("system marks") task kinds — these make up the terminal score.
const AUTO_KINDS: TaskKind[] = [TaskKind.FLAG, TaskKind.MULTIPLE_CHOICE];

/**
 * Per-stage terminal performance. `maxPoints` is the total auto-gradeable
 * (FLAG / MULTIPLE_CHOICE) points available for the stage; `earnedByIntern`
 * maps internId → points earned on those tasks. When `maxPoints` is 0 the
 * stage has no terminal component and callers fall back to the report score.
 */
export async function stageTerminalScores(stage: Stage): Promise<{
  maxPoints: number;
  earnedByIntern: Map<string, number>;
}> {
  const tasks = await prisma.assignment.findMany({
    where: { stage, kind: { in: AUTO_KINDS } },
    select: { id: true, maxPoints: true },
  });
  const maxPoints = tasks.reduce((sum, t) => sum + t.maxPoints, 0);
  const earnedByIntern = new Map<string, number>();
  if (tasks.length > 0) {
    const subs = await prisma.submission.findMany({
      where: { assignmentId: { in: tasks.map((t) => t.id) } },
      select: { internId: true, score: true },
    });
    for (const s of subs) {
      earnedByIntern.set(s.internId, (earnedByIntern.get(s.internId) ?? 0) + (s.score ?? 0));
    }
  }
  return { maxPoints, earnedByIntern };
}

/**
 * Combined 0-100 score the cutoff sorts on: 0.8*report + 0.2*terminal%.
 * Edge cases: terminal-only stage (no report) → terminal%; report-only stage
 * (terminalPct null) → report.
 */
export function combinedFinalScore(reportScore: number | null, terminalPct: number | null): number {
  const report = reportScore ?? 0;
  if (terminalPct == null) return Math.round(report);
  if (reportScore == null) return Math.round(terminalPct);
  return Math.round(0.8 * report + 0.2 * terminalPct);
}
