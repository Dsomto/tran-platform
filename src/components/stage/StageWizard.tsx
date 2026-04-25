"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  ScrollText,
  Users,
  Target,
  ShieldCheck,
  Download,
  CheckCircle2,
  Loader2,
  ChevronRight,
} from "lucide-react";
import type { StageBrief, CastMember } from "@/lib/stage-briefs";

export interface StageWizardTheme {
  slug: string;
  panelClass: string;
  headingClass: string;
  pillClass: string;
  accentTextClass: string;
  bodyTextClass: string;
  mutedTextClass: string;
  ctaBgClass: string;
  ctaHoverClass: string;
  dividerClass: string;
}

interface Props {
  brief: StageBrief;
  theme: StageWizardTheme;
  boardHref: string;
  pdfHref: string;
  /** Full name of the signed-in intern — used to validate the NDA signature. */
  internFullName: string;
  /** Already-signed timestamp — when truthy, the NDA step is skipped. */
  ndaSignedAt: string | null;
  /** Welcome line — typewritten on Step 1. Drives feel of "first day". */
  welcomeLine: string;
  /** Company / chapter name shown in the lobby strip. */
  companyName: string;
}

type StepId = "welcome" | "nda" | "team" | "brief" | "policies" | "ready";

export function StageWizard({
  brief,
  theme,
  boardHref,
  pdfHref,
  internFullName,
  ndaSignedAt,
  welcomeLine,
  companyName,
}: Props) {
  const router = useRouter();
  const includeNda = !ndaSignedAt;
  const stepOrder: StepId[] = includeNda
    ? ["welcome", "nda", "team", "brief", "policies", "ready"]
    : ["welcome", "team", "brief", "policies", "ready"];

  const [stepIdx, setStepIdx] = useState(0);
  const stepId = stepOrder[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === stepOrder.length - 1;

  // NDA state
  const [typedName, setTypedName] = useState("");
  const [signing, setSigning] = useState(false);
  const [ndaErr, setNdaErr] = useState<string | null>(null);
  const [signedJustNow, setSignedJustNow] = useState(false);

  // Team carousel state
  const [castIdx, setCastIdx] = useState(0);

  function next() {
    setStepIdx((i) => Math.min(i + 1, stepOrder.length - 1));
  }
  function back() {
    setStepIdx((i) => Math.max(i - 1, 0));
  }

  async function signNda() {
    setSigning(true);
    setNdaErr(null);
    try {
      const res = await fetch("/api/intern/sign-nda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typedName }),
      });
      const j = await res.json();
      if (!res.ok) {
        setNdaErr(j.error || "Could not sign");
        return;
      }
      setSignedJustNow(true);
      // Refresh server data so the NDA step is permanently skipped on next visit.
      router.refresh();
      // After a beat, advance to the next step.
      window.setTimeout(() => next(), 1100);
    } catch {
      setNdaErr("Network error");
    } finally {
      setSigning(false);
    }
  }

  // Returning users (NDA already signed) get a "skip" link.
  const showSkip = !!ndaSignedAt;

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* ── Top progress strip ── */}
      <div className={`${theme.panelClass} px-5 sm:px-7 py-3 flex items-center justify-between gap-4 mb-6`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={theme.pillClass}>{brief.label}</span>
          <span className={`text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.mutedTextClass}`}>
            Step {stepIdx + 1} of {stepOrder.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {stepOrder.map((id, i) => (
            <span
              key={id}
              className={`h-1 rounded-full transition-all ${
                i < stepIdx
                  ? `${theme.ctaBgClass} w-4`
                  : i === stepIdx
                    ? `${theme.ctaBgClass} w-8`
                    : "bg-white/15 w-4"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
        {showSkip && (
          <Link
            href={boardHref}
            className={`text-[11px] uppercase tracking-[0.18em] ${theme.mutedTextClass} hover:${theme.bodyTextClass} transition-colors`}
          >
            Skip → board
          </Link>
        )}
      </div>

      {/* ── Step body ── */}
      <div key={stepId} className="flex-1 wizard-step-fade">
        {stepId === "welcome" && (
          <WelcomeStep
            theme={theme}
            companyName={companyName}
            welcomeLine={welcomeLine}
            stageLabel={brief.label}
          />
        )}
        {stepId === "nda" && (
          <NdaStep
            theme={theme}
            internFullName={internFullName}
            typedName={typedName}
            setTypedName={setTypedName}
            err={ndaErr}
            signing={signing}
            signedJustNow={signedJustNow}
            onSign={signNda}
          />
        )}
        {stepId === "team" && (
          <TeamStep
            theme={theme}
            cast={brief.cast}
            castIdx={castIdx}
            setCastIdx={setCastIdx}
          />
        )}
        {stepId === "brief" && <BriefStep theme={theme} brief={brief} />}
        {stepId === "policies" && <PoliciesStep theme={theme} brief={brief} />}
        {stepId === "ready" && (
          <ReadyStep theme={theme} brief={brief} boardHref={boardHref} pdfHref={pdfHref} />
        )}
      </div>

      {/* ── Bottom nav ── */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          onClick={back}
          disabled={isFirst}
          className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium border ${theme.dividerClass} ${theme.bodyTextClass} disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-colors`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {!isLast && stepId !== "nda" && (
          <button
            onClick={() => {
              if (stepId === "team" && castIdx < brief.cast.length - 1) {
                setCastIdx((i) => i + 1);
                return;
              }
              next();
            }}
            className={`${theme.ctaBgClass} ${theme.ctaHoverClass} inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-bold uppercase tracking-[0.15em] text-white shadow-lg transition-opacity`}
          >
            {stepId === "team" && castIdx < brief.cast.length - 1
              ? "Meet the next person"
              : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Welcome step ───────────────────────────────────────────

function WelcomeStep({
  theme,
  companyName,
  welcomeLine,
  stageLabel,
}: {
  theme: StageWizardTheme;
  companyName: string;
  welcomeLine: string;
  stageLabel: string;
}) {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    setTyped("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(welcomeLine.slice(0, i));
      if (i >= welcomeLine.length) window.clearInterval(id);
    }, 28);
    return () => window.clearInterval(id);
  }, [welcomeLine]);

  return (
    <section className={`${theme.panelClass} p-10 sm:p-16 text-center relative overflow-hidden`}>
      <div className="flex justify-center mb-8">
        <div
          className={`w-20 h-20 rounded-2xl ${theme.ctaBgClass} grid place-items-center text-white shadow-xl`}
        >
          <Building2 className="w-10 h-10" />
        </div>
      </div>

      <p className={`text-[10.5px] font-mono uppercase tracking-[0.3em] mb-3 ${theme.accentTextClass}`}>
        {stageLabel}
      </p>
      <h1 className={`${theme.headingClass} text-3xl sm:text-5xl mb-6 tracking-tight`}>
        Welcome to {companyName}.
      </h1>
      <p
        className={`${theme.bodyTextClass} text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto min-h-[3.5em]`}
      >
        {typed}
        <span className="inline-block w-[2px] h-[1em] ml-0.5 bg-current align-middle animate-pulse" aria-hidden="true" />
      </p>
    </section>
  );
}

// ── NDA step ───────────────────────────────────────────────

function NdaStep({
  theme,
  internFullName,
  typedName,
  setTypedName,
  err,
  signing,
  signedJustNow,
  onSign,
}: {
  theme: StageWizardTheme;
  internFullName: string;
  typedName: string;
  setTypedName: (s: string) => void;
  err: string | null;
  signing: boolean;
  signedJustNow: boolean;
  onSign: () => void;
}) {
  return (
    <section className={`${theme.panelClass} p-7 sm:p-10`}>
      <div className={`flex items-center gap-2 mb-4 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
        <ScrollText className="w-3 h-3" />
        Reception · Sign the agreement
      </div>
      <h2 className={`${theme.headingClass} text-2xl sm:text-3xl mb-1`}>
        Confidentiality &amp; Programme Agreement
      </h2>
      <p className={`${theme.mutedTextClass} text-xs mb-5`}>
        One-time. After signing, you will not see this page again.
      </p>

      <div
        className={`${theme.bodyTextClass} text-[14px] leading-relaxed border ${theme.dividerClass} rounded-lg p-5 max-h-[42vh] overflow-y-auto space-y-3 mb-6`}
      >
        <p>
          <strong>Parties.</strong> This agreement is between Sankofa Digital
          Limited (&ldquo;Sankofa&rdquo;) and the undersigned participant in the
          Ubuntu Bridge Initiative (the &ldquo;Programme&rdquo;).
        </p>
        <p>
          <strong>1. Materials.</strong> All scenarios, logs, source-code
          snippets, character names, and artefacts you receive in this
          Programme are simulations created for training purposes. They are
          not pulled from real Sankofa production systems.
        </p>
        <p>
          <strong>2. Confidentiality.</strong> You will not redistribute the
          Programme materials, your reports, or your fellow participants&rsquo;
          work outside the Programme. &ldquo;Outside the Programme&rdquo;
          includes posting to social media, public chat groups, or AI
          training datasets.
        </p>
        <p>
          <strong>3. Permission.</strong> You will not use any technique you
          learn here against any system you do not own or have written
          permission to test. The ISC2 Code of Ethics applies in full to your
          conduct as a participant.
        </p>
        <p>
          <strong>4. IP.</strong> You retain ownership of the original work
          you submit. By submitting, you grant Sankofa and its programme
          partners a non-exclusive licence to review, score, and discuss your
          work for the purposes of the Programme.
        </p>
        <p>
          <strong>5. Privacy.</strong> Sankofa will hold your account data
          and submission history for the duration of the Programme and up to
          24 months afterwards for portfolio verification, then delete on
          request.
        </p>
        <p>
          <strong>6. Termination.</strong> Sankofa may end your participation
          for breach of this agreement, plagiarism, or conduct that
          jeopardises another participant&rsquo;s safety.
        </p>
        <p>
          <strong>7. No employment.</strong> This Programme does not create
          an employment relationship between you and Sankofa. Compensation,
          if any, is announced separately at each stage.
        </p>
        <p>
          <strong>8. Governing law.</strong> This agreement is governed by
          the laws of the Federal Republic of Nigeria.
        </p>
        <p className={`${theme.mutedTextClass} text-xs italic`}>
          Sankofa Digital Limited is a fictional organisation used for the
          purposes of this Programme. The legal undertakings above bind your
          conduct as a participant in real terms.
        </p>
      </div>

      <div className="space-y-3">
        <label className={`block text-xs font-medium uppercase tracking-wider ${theme.accentTextClass}`}>
          Sign by typing your full name
        </label>
        <p className={`text-[11px] ${theme.mutedTextClass}`}>
          Must match your account: <strong>{internFullName}</strong>
        </p>
        <input
          type="text"
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          placeholder={internFullName}
          disabled={signing || signedJustNow}
          className={`w-full bg-transparent border-b-2 ${theme.dividerClass} px-2 py-3 text-2xl ${theme.bodyTextClass} outline-none focus:border-current transition-colors`}
          style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
        />

        {err && (
          <div className="text-xs text-rose-300 bg-rose-950/30 border border-rose-500/40 rounded p-3">
            {err}
          </div>
        )}

        {signedJustNow ? (
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold text-sm">Signed. Welcome aboard.</span>
          </div>
        ) : (
          <button
            onClick={onSign}
            disabled={signing || !typedName.trim()}
            className={`${theme.ctaBgClass} ${theme.ctaHoverClass} inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-bold uppercase tracking-[0.15em] text-white shadow-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScrollText className="w-4 h-4" />}
            Sign and proceed
          </button>
        )}
      </div>
    </section>
  );
}

// ── Team carousel step ────────────────────────────────────

function alignmentClasses(alignment: CastMember["alignment"]) {
  switch (alignment) {
    case "ally":
      return { ring: "ring-emerald-400/40", bg: "bg-emerald-500/15", text: "text-emerald-300" };
    case "peer":
      return { ring: "ring-blue-400/40", bg: "bg-blue-500/15", text: "text-blue-300" };
    case "adversary":
      return { ring: "ring-rose-400/40", bg: "bg-rose-500/15", text: "text-rose-300" };
    case "external":
      return { ring: "ring-amber-400/40", bg: "bg-amber-500/15", text: "text-amber-300" };
  }
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z]/g, "")[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function TeamStep({
  theme,
  cast,
  castIdx,
  setCastIdx,
}: {
  theme: StageWizardTheme;
  cast: CastMember[];
  castIdx: number;
  setCastIdx: (i: number) => void;
}) {
  const person = cast[castIdx];
  const a = alignmentClasses(person.alignment);

  return (
    <section className={`${theme.panelClass} p-8 sm:p-12 relative overflow-hidden`}>
      <div className={`flex items-center gap-2 mb-6 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
        <Users className="w-3 h-3" />
        The team · {castIdx + 1} of {cast.length}
      </div>

      <div key={person.name} className="wizard-step-fade flex flex-col items-center text-center">
        <div
          className={`w-28 h-28 rounded-full grid place-items-center font-bold text-3xl shrink-0 ring-4 ${a.ring} ${a.bg} ${a.text} mb-5`}
        >
          {initialsOf(person.name)}
        </div>
        <h2 className={`${theme.headingClass} text-2xl sm:text-3xl mb-1`}>{person.name}</h2>
        <p className={`${theme.bodyTextClass} text-sm font-medium mb-1`}>{person.role}</p>
        {person.tag && (
          <p className={`${theme.mutedTextClass} text-xs italic mb-5`}>{person.tag}</p>
        )}
        {person.greeting && (
          <p
            className={`${theme.bodyTextClass} text-xl leading-relaxed max-w-2xl mb-6`}
            style={{ fontFamily: "Georgia, serif" }}
          >
            &ldquo;{person.greeting}&rdquo;
          </p>
        )}
        <p className={`${theme.bodyTextClass} text-[14px] leading-relaxed max-w-xl`}>
          {person.bio}
        </p>
      </div>

      {/* Pip dots — let the user jump to a specific person */}
      <div className="mt-8 flex items-center justify-center gap-1.5">
        {cast.map((_, i) => (
          <button
            key={i}
            onClick={() => setCastIdx(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === castIdx ? `${theme.ctaBgClass} w-6` : "bg-white/20 w-1.5 hover:bg-white/40"
            }`}
            aria-label={`Go to ${cast[i].name}`}
          />
        ))}
      </div>
    </section>
  );
}

// ── Brief step ─────────────────────────────────────────────

function BriefStep({ theme, brief }: { theme: StageWizardTheme; brief: StageBrief }) {
  return (
    <section className={`${theme.panelClass} p-7 sm:p-10`}>
      <div className={`flex items-center gap-2 mb-4 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
        <Target className="w-3 h-3" />
        Your mission
      </div>
      <h2 className={`${theme.headingClass} text-2xl sm:text-3xl mb-5`}>{brief.subtitle}</h2>
      <div className="space-y-4">
        {brief.missionBrief.map((p, i) => (
          <p key={i} className={`${theme.bodyTextClass} text-[15px] leading-relaxed`}>
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}

// ── Policies step ─────────────────────────────────────────

function PoliciesStep({ theme, brief }: { theme: StageWizardTheme; brief: StageBrief }) {
  return (
    <section className={`${theme.panelClass} p-7 sm:p-10`}>
      <div className={`flex items-center gap-2 mb-4 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
        <ShieldCheck className="w-3 h-3" />
        House rules
      </div>
      <h2 className={`${theme.headingClass} text-2xl sm:text-3xl mb-2`}>
        Terms &amp; policies for this stage
      </h2>
      <p className={`${theme.mutedTextClass} text-xs mb-6`}>
        Read once. These apply for the duration of the stage.
      </p>
      <ol className="space-y-3">
        {brief.termsAndPolicies.map((rule, i) => (
          <li key={i} className="flex gap-3">
            <span className={`shrink-0 font-mono text-[11px] ${theme.accentTextClass}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className={`text-[15px] leading-relaxed ${theme.bodyTextClass}`}>
              {rule}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ── Ready step ─────────────────────────────────────────────

function ReadyStep({
  theme,
  brief,
  boardHref,
  pdfHref,
}: {
  theme: StageWizardTheme;
  brief: StageBrief;
  boardHref: string;
  pdfHref: string;
}) {
  return (
    <section className={`${theme.panelClass} p-10 sm:p-16 text-center relative overflow-hidden`}>
      <div className="flex justify-center mb-6">
        <div
          className={`w-16 h-16 rounded-full ${theme.ctaBgClass} grid place-items-center text-white animate-pulse`}
        >
          <ChevronRight className="w-8 h-8" />
        </div>
      </div>

      <p className={`text-[10.5px] font-mono uppercase tracking-[0.3em] mb-3 ${theme.accentTextClass}`}>
        Briefing complete
      </p>
      <h2 className={`${theme.headingClass} text-3xl sm:text-4xl mb-4`}>
        You&apos;re ready.
      </h2>
      <p className={`${theme.bodyTextClass} text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8`}>
        Step into the mission board. Your tasks for {brief.label} are waiting.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href={boardHref}
          className={`${theme.ctaBgClass} ${theme.ctaHoverClass} inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold uppercase tracking-[0.15em] text-white shadow-xl transition-opacity`}
        >
          Enter the mission board
          <ArrowRight className="w-4 h-4" />
        </Link>
        <a
          href={pdfHref}
          download
          className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold border ${theme.dividerClass} ${theme.bodyTextClass} hover:bg-white/5 transition-colors`}
        >
          <Download className="w-4 h-4" />
          Download capstone brief
        </a>
      </div>
    </section>
  );
}
