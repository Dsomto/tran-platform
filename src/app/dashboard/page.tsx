import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Topbar } from "@/components/dashboard/topbar";
import { Card } from "@/components/ui/card";
import { SlackCard } from "@/components/dashboard/slack-card";
import { StageDeadlineCountdown } from "@/components/stage/StageDeadlineCountdown";
import { stageUrl, type StageSlug } from "@/lib/stage-routes";
import { stageWindowAcceptsSubmissions, stageWindowHasStarted } from "@/lib/stage-window";
import { formatDate, stageToNumber, trackLabel } from "@/lib/utils";
import {
  ADVANCED_PROJECTS,
  ADVANCED_STAGE_META,
  type AdvancedTrack,
} from "@/lib/advanced-stage";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DoorOpen,
  FileText,
  Layers3,
  Lock,
  Pin,
  Star,
  Trophy,
} from "lucide-react";

type StageEnum =
  | "STAGE_0"
  | "STAGE_1"
  | "STAGE_2"
  | "STAGE_3"
  | "STAGE_4"
  | "STAGE_5"
  | "STAGE_6"
  | "STAGE_7"
  | "STAGE_8"
  | "STAGE_9";

const STAGE_NAMES: Record<StageEnum, string> = {
  STAGE_0: "Induction at the Gate",
  STAGE_1: "Ciphers & Secrets",
  STAGE_2: "The Attack Surface",
  STAGE_3: "Inside the Walls",
  STAGE_4: "The Debrief",
  STAGE_5: "Advanced · Signal",
  STAGE_6: "Advanced · Exposure",
  STAGE_7: "Advanced · Architecture",
  STAGE_8: "Advanced · Adversity",
  STAGE_9: "Advanced · The Final Case",
};

const STAGE_ENUM_TO_SLUG: Record<StageEnum, StageSlug> = {
  STAGE_0: "stage-0",
  STAGE_1: "stage-1",
  STAGE_2: "stage-2",
  STAGE_3: "stage-3",
  STAGE_4: "stage-4",
  STAGE_5: "stage-5",
  STAGE_6: "stage-6",
  STAGE_7: "stage-7",
  STAGE_8: "stage-8",
  STAGE_9: "stage-9",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Role-based redirects are now enforced in src/app/dashboard/layout.tsx,
  // which covers /dashboard AND every /dashboard/* sub-route. Keep these as
  // defense in depth — if the layout is ever bypassed (e.g., a future
  // route group reshuffle), this page still won't render the intern card
  // for graders/admins.
  if (session.role === "GRADER") redirect("/admin/reports");
  if (session.role === "ADMIN" || session.role === "SUPER_ADMIN") redirect("/admin");

  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
  });

  // ── Pre-intern states ──────────────────────────────────────────────
  // A User row exists (they could log in) but no Intern row. Three real
  // cases:
  //   1. Approved PublicApplication — Intern row never got created
  //      (partial failure in onboardApprovedApplicant). They ARE accepted;
  //      the data layer just didn't finish. Direct them to support; the
  //      `repair-orphaned-interns.ts` script also converges this.
  //   2. Pending/rejected PublicApplication — admin hasn't approved yet
  //      or did not. Be specific.
  //   3. No PublicApplication on record AT ALL — somehow has a User
  //      account without applying. Cohort 1 applications are closed; do
  //      not link to /apply, that page just shows the "closed" banner
  //      and confuses people.
  //
  // We match PublicApplication by email (not userId — PublicApplication
  // has no userId column).
  if (!intern) {
    const app = await prisma.publicApplication.findUnique({
      where: { email: session.email.toLowerCase() },
      select: { status: true },
    });
    const isApprovedButOrphaned = app?.status === "approved";
    const isPending = app?.status === "pending";
    const isRejected = app?.status === "rejected";
    const hasNoApp = !app;

    const title = isApprovedButOrphaned
      ? "Your account isn't fully set up"
      : isPending
        ? "Application under review"
        : isRejected
          ? "Application not approved"
          : "No application on file";

    const body = isApprovedButOrphaned
      ? "We approved your application but the final setup step didn't complete on our end. Refresh this page in a few minutes. If it's still here, email cyberops@ethnoscyber.com with your full name and we'll fix it manually — usually within an hour."
      : isPending
        ? "We'll email you the moment a decision is made. No need to refresh."
        : isRejected
          ? "Your application was not approved for this cohort."
          : "We don't have an application linked to this email. Applications for the current cohort are closed; if you believe this is an error, message cyberops@ethnoscyber.com.";

    return (
      <>
        <Topbar
          title="Dashboard"
          firstName={session.firstName}
          lastName={session.lastName}
          avatarUrl={session.avatarUrl}
        />
        <div className="flex-1 flex items-center justify-center p-8">
          <Card variant="glass" className="max-w-md text-center p-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
            <p className="text-sm text-muted mb-2 leading-relaxed">{body}</p>
            {hasNoApp && (
              <p className="text-xs text-muted/70 mt-3">
                Signed in as <span className="font-mono">{session.email}</span>
              </p>
            )}
          </Card>
        </div>
      </>
    );
  }

  // ── Active intern dashboard ──────────────────────────────────────────────
  const stageEnum = intern.currentStage as StageEnum;
  const stageNum = stageToNumber(intern.currentStage);
  const stageName = STAGE_NAMES[stageEnum] ?? `Stage ${stageNum}`;
  const isAdvancedStage = stageNum >= 5;
  const progressIndex = isAdvancedStage ? stageNum - 5 : stageNum;

  const [stageWindow, report, topAnnouncement, rank, passedCount] = await Promise.all([
    prisma.stageWindow.findUnique({ where: { stage: stageEnum } }),
    prisma.stageReport.findUnique({
      where: { internId_stage: { internId: intern.id, stage: stageEnum } },
    }),
    prisma.announcement.findFirst({
      where: {
        AND: [
          { OR: [{ stage: null }, { stage: stageEnum }] },
          { OR: [{ track: null }, { track: intern.track }] },
        ],
      },
      include: { author: { select: { firstName: true, lastName: true } } },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    }),
    prisma.intern.count({
      where: { isActive: true, points: { gt: intern.points } },
    }).then((ahead) => ahead + 1),
    prisma.stageReport.count({
      where: { internId: intern.id, status: "PASSED" },
    }),
  ]);

  // ── Derived, all from real data (no invented metrics) ──
  const hasStarted = stageWindowHasStarted(stageWindow);
  const opensLater = stageWindow?.status === "OPEN" && !hasStarted && !!stageWindow?.activeFrom;
  const watLabel = (value: Date) =>
    new Intl.DateTimeFormat("en-GB", {
      weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Lagos",
    }).format(value);

  // Scenario line + track path
  const advProjects = isAdvancedStage ? ADVANCED_PROJECTS[intern.track as AdvancedTrack] ?? [] : [];
  const advCurrent = advProjects.find((p) => p.stage === stageEnum) ?? null;
  const scenario = isAdvancedStage
    ? advCurrent?.objective ?? "Your assigned specialist project. Build the system, prove every claim, and defend it."
    : "Read the brief, work the mission tasks, then build and submit your capstone for this stage.";

  type PathItem = { key: string; label: string; meta: string; status: "cleared" | "current" | "locked" };
  const trackPath: PathItem[] = isAdvancedStage
    ? [
        { key: "found", label: "Foundations · Stages 0–4", meta: "Core programme completed", status: "cleared" },
        ...advProjects.map((p, i) => {
          const n = stageToNumber(p.stage);
          const status: PathItem["status"] = n < stageNum ? "cleared" : n === stageNum ? "current" : "locked";
          return {
            key: p.stage,
            label: `Advanced ${i + 1} · ${ADVANCED_STAGE_META[p.stage as keyof typeof ADVANCED_STAGE_META].name}`,
            meta: p.title,
            status,
          };
        }),
      ]
    : [0, 1, 2, 3, 4].map((n) => ({
        key: `STAGE_${n}`,
        label: `Stage ${n} · ${STAGE_NAMES[`STAGE_${n}` as StageEnum]}`,
        meta: "",
        status: (n < stageNum ? "cleared" : n === stageNum ? "current" : "locked") as PathItem["status"],
      }));

  const railLabels = isAdvancedStage
    ? (["STAGE_5", "STAGE_6", "STAGE_7", "STAGE_8", "STAGE_9"] as const).map((s) => ADVANCED_STAGE_META[s].name)
    : ["Stage 0", "Stage 1", "Stage 2", "Stage 3", "Stage 4"];

  const isStageOpen = stageWindowAcceptsSubmissions(stageWindow);
  const roomHref = stageUrl(STAGE_ENUM_TO_SLUG[stageEnum]);
  const reportHref = `/dashboard/reports/${stageEnum}`;

  const reportStatusLabel = (() => {
    if (!report) return { text: "Not started", tone: "muted" as const };
    if (report.status === "PASSED") return { text: "Passed", tone: "emerald" as const };
    if (report.status === "FAILED") return { text: "Did not pass", tone: "rose" as const };
    if (
      report.status === "GRADED" ||
      report.status === "PENDING_PROMOTION" ||
      report.status === "PENDING_ELIMINATION"
    )
      return { text: "Result pending release", tone: "blue" as const };
    if (report.status === "SUBMITTED" || report.status === "UNDER_REVIEW")
      return { text: "In review", tone: "amber" as const };
    if (report.status === "DRAFT") return { text: "Draft saved", tone: "slate" as const };
    return { text: report.status, tone: "muted" as const };
  })();

  return (
    <>
      <Topbar
        title={`Hi, ${session.firstName}`}
        subtitle={`${trackLabel(intern.track)} · Stage ${stageNum}`}
        firstName={session.firstName}
        lastName={session.lastName}
        avatarUrl={session.avatarUrl}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          {/* Slack nudge — renders nothing if already joined */}
          {!intern.slackJoined && (
            <SlackCard
              inviteUrl={process.env.SLACK_CHANNEL_URL ?? null}
              joined={false}
              joinedAt={null}
            />
          )}

          {/* "How this works" stays visible until they've passed at least one
              stage. New interns mid-stage need this even after their first
              report goes in — disappearing it as soon as a draft exists is
              what caused the "where do I put the capstone?" confusion. */}
          {passedCount === 0 && (
            <section className="bg-blue/5 border border-blue/20 rounded-2xl p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue mb-2">
                New here? How this works
              </p>
              <ol className="space-y-2 text-sm text-foreground/85 leading-relaxed">
                <li className="flex gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue/15 text-blue text-[11px] font-bold grid place-items-center mt-0.5">1</span>
                  <span><strong>Read the brief.</strong> Click <em>Enter the room</em> below — that opens the stage&apos;s landing page with the scenario, the cast, and the resources.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue/15 text-blue text-[11px] font-bold grid place-items-center mt-0.5">2</span>
                  <span><strong>Do the tasks.</strong> The mission board has the stage&apos;s flags, MCQs, and short writeups. Each one is graded as you submit.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue/15 text-blue text-[11px] font-bold grid place-items-center mt-0.5">3</span>
                  <span><strong>Build your capstone.</strong> Off-platform — in Google Docs / Word. Put every deliverable into one shared folder.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue/15 text-blue text-[11px] font-bold grid place-items-center mt-0.5">4</span>
                  <span><strong>Submit the folder link.</strong> On your stage&apos;s submit page, paste the Drive link and a short executive summary.</span>
                </li>
              </ol>
            </section>
          )}

          {/* ── Hero: current stage command panel ── */}
          <section className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
            <div
              className="relative px-6 pb-8 pt-7 text-white sm:px-8"
              style={{ background: "radial-gradient(120% 140% at 12% 0%, #2E5BE6 0%, #1E3FB0 46%, #132A79 100%)" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                    {isAdvancedStage ? "Advanced track · current project" : "Your current stage"}
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-[30px]">
                    {isAdvancedStage
                      ? `Advanced ${progressIndex + 1} · ${ADVANCED_STAGE_META[stageEnum as keyof typeof ADVANCED_STAGE_META].name}`
                      : `Stage ${stageNum} · ${stageName}`}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">{scenario}</p>
                </div>
                {isStageOpen ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden="true" /> Open now
                  </span>
                ) : opensLater && stageWindow?.activeFrom ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Opens {watLabel(stageWindow.activeFrom)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Not open yet
                  </span>
                )}
              </div>

              {/* Progress rail with labels */}
              <div
                className="mt-6 flex gap-2"
                aria-label={isAdvancedStage ? `Advanced project ${progressIndex + 1} of 5` : `Stage ${stageNum} of 4`}
              >
                {railLabels.map((lab, i) => (
                  <div key={lab + i} className="min-w-0 flex-1">
                    <div
                      className={`h-[5px] rounded-full ${
                        i < progressIndex ? "bg-white" : i === progressIndex ? "bg-emerald-300" : "bg-white/25"
                      }`}
                    />
                    <p className={`mt-1.5 truncate text-[10px] font-medium ${i === progressIndex ? "text-white" : "text-white/55"}`}>
                      {lab}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer: actions */}
            <div className="flex flex-wrap items-center gap-3 px-6 py-4 sm:px-8">
              {isStageOpen ? (
                <>
                  <Link href={roomHref} className="inline-flex items-center gap-1.5 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-dark">
                    <DoorOpen className="h-4 w-4" /> {isAdvancedStage ? "Open current project" : "Enter the room"}
                  </Link>
                  {!isAdvancedStage && (
                    <Link href={`${roomHref}#capstone`} className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700">
                      <Trophy className="h-4 w-4" /> View your capstone
                    </Link>
                  )}
                  <Link href={reportHref} className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover">
                    <FileText className="h-4 w-4" />
                    {report?.status === "DRAFT" ? "Continue draft" : report?.status === "SUBMITTED" || report?.status === "UNDER_REVIEW" ? "View submission" : report?.status === "PASSED" || report?.status === "FAILED" ? "View result" : "Submit report"}
                  </Link>
                  {isAdvancedStage && (
                    <Link href="/dashboard/advanced" className="inline-flex items-center gap-1.5 rounded-full border border-blue/30 bg-blue/5 px-5 py-2.5 text-sm font-semibold text-blue transition-colors hover:bg-blue/10">
                      <Layers3 className="h-4 w-4" /> View your track
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-muted">
                    {opensLater && stageWindow?.activeFrom
                      ? `This ${isAdvancedStage ? "project" : "stage"} opens ${watLabel(stageWindow.activeFrom)}. We'll email you when it's live.`
                      : "We'll email you the moment this opens — and pin the announcement here."}
                  </p>
                  {isAdvancedStage && (
                    <Link href="/dashboard/advanced" className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-blue/30 bg-blue/5 px-5 py-2.5 text-sm font-semibold text-blue transition-colors hover:bg-blue/10">
                      <Layers3 className="h-4 w-4" /> View your track
                    </Link>
                  )}
                </>
              )}
            </div>
          </section>

          {/* ── Deadline countdown (reuses the intern-room component) ── */}
          {stageWindow?.submitUntil && (isStageOpen || opensLater) && (
            <StageDeadlineCountdown
              submitUntil={stageWindow.submitUntil.toISOString()}
              activeFrom={stageWindow.activeFrom ? stageWindow.activeFrom.toISOString() : null}
              className="rounded-2xl"
            />
          )}

          {/* ── Stats ── */}
          <section className="grid grid-cols-3 gap-3 sm:gap-4">
            <StatTile icon={Star} label="Points" value={String(intern.points)} tone="blue" />
            <StatTile icon={Trophy} label="Cohort rank" value={`#${rank}`} tone="amber" />
            <StatTile icon={CheckCircle2} label="Stages cleared" value={`${passedCount} of 9`} tone="emerald" />
          </section>

          {/* ── Track path + side ── */}
          <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-border bg-surface">
              <div className="flex items-center justify-between px-5 pt-5 sm:px-6">
                <h3 className="text-sm font-semibold text-foreground">Your track path</h3>
                {isAdvancedStage && (
                  <Link href="/dashboard/advanced" className="inline-flex items-center gap-1 text-xs font-semibold text-blue">
                    View track <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
              <ol className="px-5 pb-4 pt-2 sm:px-6">
                {trackPath.map((it, i) => (
                  <li key={it.key} className="relative flex gap-4 py-2.5">
                    {i < trackPath.length - 1 && (
                      <span className="absolute bottom-0 left-[15px] top-9 w-px bg-border" aria-hidden="true" />
                    )}
                    <span
                      className={`relative z-[1] grid h-8 w-8 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold ${
                        it.status === "cleared"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : it.status === "current"
                            ? "bg-blue text-white"
                            : "border border-border bg-surface-hover text-muted"
                      }`}
                    >
                      {it.status === "cleared" ? <CheckCircle2 className="h-4 w-4" /> : String(i)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{it.label}</p>
                      {it.meta && <p className="mt-0.5 truncate text-xs text-muted">{it.meta}</p>}
                    </div>
                    <span
                      className={`self-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        it.status === "cleared"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : it.status === "current"
                            ? "bg-blue/10 text-blue dark:text-blue-300"
                            : "border border-border bg-surface-hover text-muted"
                      }`}
                    >
                      {it.status === "cleared" ? "Cleared" : it.status === "current" ? "In progress" : "Locked"}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-6">
              {topAnnouncement && (
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Latest announcement</h3>
                    <Link href="/dashboard/announcements" className="text-xs font-medium text-blue hover:text-blue-dark">
                      See all →
                    </Link>
                  </div>
                  <Link href={`/dashboard/announcements#${topAnnouncement.id}`} className="block">
                    <div className="mb-1.5 flex items-start gap-2">
                      {topAnnouncement.isPinned && <Pin className="mt-0.5 h-4 w-4 shrink-0 text-blue" />}
                      <h4 className="text-sm font-semibold text-foreground">{topAnnouncement.title}</h4>
                    </div>
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted">{topAnnouncement.content}</p>
                    <p className="mt-2.5 text-[11px] text-muted/70">
                      {topAnnouncement.author.firstName} {topAnnouncement.author.lastName} · {formatDate(topAnnouncement.createdAt)}
                    </p>
                  </Link>
                </div>
              )}

              <div className="rounded-2xl border border-border bg-surface p-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">This stage&apos;s submission</h3>
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                    reportStatusLabel.tone === "emerald"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : reportStatusLabel.tone === "rose"
                        ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
                        : reportStatusLabel.tone === "blue"
                          ? "border-blue/30 bg-blue/10 text-blue dark:text-blue-300"
                          : reportStatusLabel.tone === "amber"
                            ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
                            : "border-border bg-surface-hover text-muted"
                  }`}
                >
                  {reportStatusLabel.text}
                </span>
                <p className="mb-4 mt-3 text-xs leading-relaxed text-muted">
                  {report?.status === "PASSED"
                    ? "You've cleared this stage — grab your certificate on the Reports page."
                    : report?.status === "SUBMITTED" || report?.status === "UNDER_REVIEW"
                      ? "Your report is with the graders. We'll email you when the result is released."
                      : report?.status === "DRAFT"
                        ? "You have a draft saved. Finish it and submit before the deadline."
                        : isStageOpen
                          ? "Build your work off-platform, then paste your view-only Drive link and a short executive summary."
                          : "Nothing to submit yet — this stage isn't open."}
                </p>
                {isStageOpen && (
                  <Link href={reportHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue">
                    <FileText className="h-4 w-4" /> {report ? "Open your report" : "Start your report"}
                  </Link>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: "blue" | "amber" | "emerald";
}) {
  const toneClasses =
    tone === "blue"
      ? "bg-blue/10 text-blue dark:text-blue-300"
      : tone === "amber"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 hover:border-blue/40 transition-colors">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${toneClasses}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums leading-none">{value}</p>
      <p className="text-xs text-muted mt-1.5 leading-tight">{label}</p>
    </div>
  );
}
