import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { prisma } from "@/lib/db";
import { Trophy, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STAGE_LABEL: Record<string, string> = {
  STAGE_0: "Stage 0 — Foundations",
  STAGE_1: "Stage 1 — Applied Cryptography",
  STAGE_2: "Stage 2 — Web Application Security",
  STAGE_3: "Stage 3 — Incident Response",
  STAGE_4: "Stage 4 — Governance & Risk",
};

const STAGE_ORDER = ["STAGE_0", "STAGE_1", "STAGE_2", "STAGE_3", "STAGE_4"];

export default async function ResultsPage() {
  // Every report that has been finalised as PASSED. We deliberately do not
  // publish FAILED scores — the cohort agreement is that names + scores of
  // people who PASSED are public; people who didn't pass are not surfaced.
  const passed = await prisma.stageReport.findMany({
    where: { status: "PASSED" },
    select: {
      id: true,
      stage: true,
      score: true,
      finalScore: true,
      intern: {
        select: {
          user: { select: { firstName: true, lastName: true } },
          track: true,
        },
      },
    },
    orderBy: [{ stage: "asc" }, { finalScore: "desc" }, { score: "desc" }],
  });

  // Group by stage and order each list by final score desc.
  const byStage = new Map<string, typeof passed>();
  for (const r of passed) {
    const list = byStage.get(r.stage) ?? [];
    list.push(r);
    byStage.set(r.stage, list);
  }
  const stagesWithPasses = STAGE_ORDER.filter((s) => byStage.has(s));

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <header className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue/10 text-blue text-xs font-semibold tracking-wider uppercase mb-4">
              <Trophy className="h-3.5 w-3.5" /> Cohort 1 · Results
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              The interns who have made it through
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Each stage of the Ubuntu Bridge Initiative Cybersecurity Internship is
              graded against a published rubric. The names below are interns who
              cleared the cutoff for that stage. Scores are out of 100; the passing
              mark is 70.
            </p>
          </header>

          {stagesWithPasses.length === 0 ? (
            <div className="p-12 bg-white border border-border rounded-xl text-center text-muted-foreground">
              No stage results have been published yet.
            </div>
          ) : (
            <div className="space-y-10">
              {stagesWithPasses.map((stage) => {
                const list = byStage.get(stage)!;
                return (
                  <section
                    key={stage}
                    className="bg-white border border-border rounded-2xl overflow-hidden"
                  >
                    <div className="px-6 py-4 border-b border-border bg-blue/5 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-lg font-bold text-foreground">
                          {STAGE_LABEL[stage] ?? stage}
                        </h2>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {list.length} intern{list.length === 1 ? "" : "s"} passed
                      </span>
                    </div>
                    <ol className="divide-y divide-border">
                      {list.map((r, i) => {
                        const name =
                          `${r.intern.user.firstName} ${r.intern.user.lastName}`.trim();
                        const displayScore = r.finalScore ?? r.score ?? 0;
                        return (
                          <li
                            key={r.id}
                            className="px-6 py-3 flex items-center gap-4"
                          >
                            <span className="w-10 text-right text-sm font-mono text-muted-foreground tabular-nums">
                              {i + 1}.
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {name}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-foreground tabular-nums">
                              {displayScore}
                              <span className="text-muted-foreground font-normal">
                                {" "}
                                / 100
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                );
              })}
            </div>
          )}

          <p className="mt-10 text-center text-xs text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Names appear in descending score order. Reviewer feedback and the
            individual deliverables are not public — only the intern, their
            employer references, and the programme office have access to those.
            If you are an intern and would prefer your name not appear here,
            email the programme office.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
