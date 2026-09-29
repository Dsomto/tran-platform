import { ExternalLink, Film, FolderGit2, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TRACK_LABEL: Record<string, string> = {
  SOC_ANALYSIS: "SOC Analysis",
  ETHICAL_HACKING: "Ethical Hacking",
  GRC: "GRC",
};

export default async function FinalistProjectsPage() {
  await requireAdmin();
  const finalists = await prisma.intern.findMany({
    where: { finalist: true, isActive: true, currentStage: "STAGE_9" },
    orderBy: [{ track: "asc" }, { user: { firstName: "asc" } }],
    select: {
      id: true,
      track: true,
      user: { select: { firstName: true, lastName: true, email: true } },
      finalistProject: true,
    },
  });
  const submitted = finalists.filter((row) => row.finalistProject);

  return (
    <div className="min-h-full bg-background px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div><p className="text-xs font-bold uppercase text-blue">Stage 9B</p><h1 className="mt-2 text-3xl font-bold text-foreground">Finalist project submissions</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">The ten finalists submit their project access link and public-showcase video here. Links open in a new tab for staff verification.</p></div>
          <div className="flex gap-3">
            <div className="border border-border bg-surface px-4 py-3"><p className="text-xs text-muted">Submitted</p><p className="text-2xl font-bold text-foreground">{submitted.length}</p></div>
            <div className="border border-border bg-surface px-4 py-3"><p className="text-xs text-muted">Remaining</p><p className="text-2xl font-bold text-foreground">{finalists.length - submitted.length}</p></div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto border border-border bg-surface">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="bg-surface-hover text-xs uppercase text-muted"><tr><th className="px-4 py-3">Finalist</th><th className="px-4 py-3">Track</th><th className="px-4 py-3">Project</th><th className="px-4 py-3">Video</th><th className="px-4 py-3">Submitted</th></tr></thead>
            <tbody className="divide-y divide-border">
              {finalists.map((row) => {
                const submission = row.finalistProject;
                return <tr key={row.id} className="align-top">
                  <td className="px-4 py-4"><p className="font-semibold text-foreground">{row.user.firstName} {row.user.lastName}</p><p className="mt-1 text-xs text-muted">{row.user.email}</p></td>
                  <td className="px-4 py-4 text-muted">{TRACK_LABEL[row.track] ?? row.track}</td>
                  <td className="max-w-sm px-4 py-4">{submission ? <><p className="font-semibold text-foreground">{submission.projectTitle}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{submission.projectSummary}</p><a href={submission.projectUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 font-semibold text-blue hover:underline"><FolderGit2 className="h-4 w-4" /> Open project <ExternalLink className="h-3 w-3" /></a></> : <span className="text-muted">Not submitted</span>}</td>
                  <td className="px-4 py-4">{submission ? <a href={submission.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-blue hover:underline"><Film className="h-4 w-4" /> Watch video <ExternalLink className="h-3 w-3" /></a> : <span className="text-muted">—</span>}</td>
                  <td className="px-4 py-4 text-muted">{submission ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(submission.submittedAt) : "—"}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>

        {finalists.length === 0 && <div className="mt-8 flex items-center gap-3 border border-border bg-surface p-5 text-muted"><Users className="h-5 w-5" /> No active Stage 9B finalists were found.</div>}
      </div>
    </div>
  );
}
