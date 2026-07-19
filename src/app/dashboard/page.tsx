import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Topbar } from "@/components/dashboard/topbar";
import { Card } from "@/components/ui/card";
import { SlackCard } from "@/components/dashboard/slack-card";
import { stageUrl, type StageSlug } from "@/lib/stage-routes";
import { stageWindowHasStarted } from "@/lib/stage-window";
import { formatDate, stageToNumber, trackLabel } from "@/lib/utils";
import {
  Clock,
  DoorOpen,
  FileText,
  Pin,
  Star,
  Trophy,
  Lock,
  Layers3,
} from "lucide-react";
import { EggHoverNote, EggProgressGlow } from "@/components/dashboard/easter-eggs/widgets";

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

  const isStageOpen = stageWindowHasStarted(stageWindow);
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
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
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

          {/* ── Hero: your current stage ── */}
          <section className="bg-surface border border-border rounded-2xl p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue mb-1">
                  Your current stage
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Stage {stageNum} · {stageName}
                </h2>
              </div>
              {isStageOpen ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                  Open
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface-hover text-muted border border-border">
                  <Lock className="w-3 h-3" /> Not open yet
                </span>
              )}
            </div>

            {/* The dashboard changes from the five foundation chapters to the
                five assigned-track projects after Stage 4. */}
            <div
              className="flex items-center gap-1 mb-2"
              aria-label={isAdvancedStage
                ? `On advanced project ${progressIndex + 1} of 5`
                : `On stage ${stageNum} of 4 (${stageNum + 1} of 5 chapters)`}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i <= progressIndex ? "bg-blue" : "bg-border-light"
                  }`}
                />
              ))}
            </div>
            <EggProgressGlow value={!isAdvancedStage && stageNum >= 4 ? 100 : 0} className="block h-1.5 w-full -mt-1.5 mb-1" />
            <p className="text-[11px] font-mono text-muted-foreground mb-6">
              {isAdvancedStage ? (
                <>Advanced project {progressIndex + 1} of 5 · Assigned track only</>
              ) : stageNum > 0 ? (
                <EggHoverNote note="You still remember the gate.">Chapter {stageNum + 1} of 5</EggHoverNote>
              ) : (
                <>Chapter {stageNum + 1} of 5</>
              )}
            </p>

            {isStageOpen ? (
              <div className="flex flex-wrap gap-3">
                {isAdvancedStage && (
                  <Link
                    href="/dashboard/advanced"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-full border border-blue/30 bg-blue/5 text-blue hover:bg-blue/10 transition-colors"
                  >
                    <Layers3 className="w-4 h-4" />
                    View your track
                  </Link>
                )}
                <Link
                  href={roomHref}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-full bg-blue text-white hover:bg-blue-dark transition-colors"
                >
                  <DoorOpen className="w-4 h-4" />
                  {isAdvancedStage ? "Open current project" : "Enter the room"}
                </Link>
                {!isAdvancedStage && (
                  <Link
                    href={`${roomHref}#capstone`}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Trophy className="w-4 h-4" />
                    View your capstone
                  </Link>
                )}
                <Link
                  href={reportHref}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-full border border-border text-foreground hover:bg-surface-hover transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  {report?.status === "DRAFT"
                    ? "Continue draft"
                    : report?.status === "SUBMITTED" || report?.status === "UNDER_REVIEW"
                      ? "View submission"
                      : report?.status === "PASSED" || report?.status === "FAILED"
                        ? "View result"
                        : "Submit report"}
                </Link>
                <span
                  className={`self-center text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    reportStatusLabel.tone === "emerald"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30"
                      : reportStatusLabel.tone === "rose"
                        ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30"
                        : reportStatusLabel.tone === "blue"
                          ? "bg-blue/10 text-blue dark:text-blue-300 border-blue/30"
                          : reportStatusLabel.tone === "amber"
                            ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30"
                            : reportStatusLabel.tone === "slate"
                              ? "bg-surface-hover text-muted border-border"
                              : "bg-surface text-muted border-border"
                  }`}
                >
                  {reportStatusLabel.text}
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted leading-relaxed">
                  We&apos;ll send you an email the moment this stage opens. You&apos;ll find the
                  announcement pinned in your dashboard too.
                </p>
                {isAdvancedStage && (
                  <Link
                    href="/dashboard/advanced"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-full border border-blue/30 bg-blue/5 text-blue hover:bg-blue/10 transition-colors"
                  >
                    <Layers3 className="w-4 h-4" />
                    View your track
                  </Link>
                )}
              </div>
            )}
          </section>

          {/* ── Two small stats ── */}
          <section className="grid grid-cols-2 gap-4">
            <MiniStat icon={Star} label="Points" value={String(intern.points)} tone="blue" />
            <MiniStat icon={Trophy} label="Your rank" value={`#${rank}`} tone="amber" />
          </section>

          {/* ── Latest announcement (1 only) ── */}
          {topAnnouncement && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Latest announcement
                </h3>
                <Link
                  href="/dashboard/announcements"
                  className="text-xs font-medium text-blue hover:text-blue-dark"
                >
                  See all →
                </Link>
              </div>
              <Link
                href={`/dashboard/announcements#${topAnnouncement.id}`}
                className="block bg-surface border border-border rounded-2xl p-5 hover:border-blue/40 transition-colors"
              >
                <div className="flex items-start gap-2 mb-1.5">
                  {topAnnouncement.isPinned && (
                    <Pin className="w-4 h-4 text-blue shrink-0 mt-0.5" />
                  )}
                  <h4 className="text-sm font-semibold text-foreground">
                    {topAnnouncement.title}
                  </h4>
                </div>
                <p className="text-sm text-muted leading-relaxed line-clamp-2">
                  {topAnnouncement.content}
                </p>
                <p className="text-[11px] text-muted/70 mt-2.5">
                  {topAnnouncement.author.firstName} {topAnnouncement.author.lastName} ·{" "}
                  {formatDate(topAnnouncement.createdAt)}
                </p>
              </Link>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: "blue" | "amber";
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          tone === "blue" ? "bg-blue/10 text-blue dark:text-blue-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tabular-nums leading-none">{value}</p>
        <p className="text-xs text-muted mt-1">{label}</p>
      </div>
    </div>
  );
}
