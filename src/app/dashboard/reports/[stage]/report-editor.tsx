"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ExternalLink,
  Mail,
  ListChecks,
  Download,
  FolderDown,
} from "lucide-react";
import { emitEggToast } from "@/components/dashboard/easter-eggs/hooks";

interface InitialReport {
  id: string;
  executiveSummary: string;
  reportUrl: string | null;
  attachmentUrl: string | null;
  status: string;
  version: number;
  score: number | null;
  feedback: string | null;
  submittedAt: string | null;
}

interface FolderItem {
  id: string;
  title: string;
  deliverable: string;
}

interface EvidenceFile {
  filename: string;
  /** URL the file is served from. Use `/capstone/stage-N/<file>` for the
   *  in-app downloads we host under public/. */
  url: string;
  /** One-line description of what this file contains and what the intern
   *  is expected to do with it. */
  description: string;
  /** Bytes — display only. Optional. */
  bytes?: number;
}

interface Props {
  stage: string;
  stageLabel: string;
  stageSubtitle: string;
  /** All paragraphs of the stage's mission brief — the in-fiction storyline
   *  plus the explicit enumeration of evidence files. We show the whole
   *  thing so the brief on this page is self-contained, not a one-line tease. */
  missionBrief: string[];
  sectionHints: string[];
  /** Chapter number, 1-5. */
  chapter: number;
  /** Who this capstone is delivered to, in-fiction. */
  reportTo: string;
  /** The files the stage expects in the submitted folder. */
  folderContents: FolderItem[];
  /** Stage-specific evidence files the intern downloads to do the capstone.
   *  Hosted in-app under public/capstone/stage-N/. Optional — empty / absent
   *  means the stage has no downloadable input pack (legacy stages). */
  evidencePack?: EvidenceFile[];
  initialReport: InitialReport | null;
  locked: boolean;
}

export function ReportEditor({
  stage,
  stageLabel,
  stageSubtitle,
  missionBrief,
  sectionHints,
  chapter,
  reportTo,
  folderContents,
  evidencePack,
  initialReport,
  locked,
}: Props) {
  const router = useRouter();
  const [execSummary, setExecSummary] = useState(initialReport?.executiveSummary ?? "");
  const [reportUrl, setReportUrl] = useState(initialReport?.reportUrl ?? "");
  const [attachmentUrl, setAttachmentUrl] = useState(initialReport?.attachmentUrl ?? "");
  const [reportId, setReportId] = useState(initialReport?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  const execWordCount = execSummary.trim().split(/\s+/).filter(Boolean).length;
  const execCharCount = execSummary.length;
  const EXEC_MAX_CHARS = 5000;
  const charsApproachingLimit = execCharCount >= 4500;
  const charsOverLimit = execCharCount > EXEC_MAX_CHARS;

  // egg #5: typing "root access" in the summary triggers a terminal-style nudge.
  const rootAccessEgg = useRef(false);
  useEffect(() => {
    const has = execSummary.toLowerCase().includes("root access");
    if (has && !rootAccessEgg.current) {
      rootAccessEgg.current = true;
      emitEggToast("permission denied. write better evidence.");
    } else if (!has) {
      rootAccessEgg.current = false;
    }
  }, [execSummary]);

  async function saveDraft(silent = false): Promise<boolean> {
    if (locked) return false;
    if (!execSummary.trim() && !reportUrl.trim()) return false;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          executiveSummary: execSummary,
          reportUrl: reportUrl.trim() || null,
          attachmentUrl: attachmentUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (!silent) {
          setError(
            res.status === 401
              ? "__SESSION_EXPIRED__"
              : data.error || "Failed to save"
          );
        }
        return false;
      }
      setReportId(data.report.id);
      setLastSavedAt(new Date());
      setDirty(false);
      return true;
    } catch {
      if (!silent) setError("Network error. Try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function submitReport() {
    if (locked) return;
    if (execSummary.trim().length < 50) {
      setError("Your executive summary is too short. Write at least a few sentences.");
      return;
    }
    if (execSummary.length > EXEC_MAX_CHARS) {
      setError(`Your executive summary is over the ${EXEC_MAX_CHARS}-character limit. Trim it before submitting.`);
      return;
    }
    if (!isValidUrl(reportUrl)) {
      setError("Paste a valid link to your report folder (Google Drive, Dropbox, etc.).");
      return;
    }
    const ok = window.confirm(
      "Submit this report for grading? Two reviewers will read it. You can resubmit later if needed, but you cannot edit it while it is being reviewed."
    );
    if (!ok) return;
    setSubmitting(true);
    setError(null);
    const savedOk = await saveDraft(true);
    if (!savedOk) {
      setSubmitting(false);
      setError("Could not save before submitting. Try again.");
      return;
    }
    try {
      const res = await fetch(`/api/reports/${reportId}/submit`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 401
            ? "__SESSION_EXPIRED__"
            : data.error || "Failed to submit"
        );
        setSubmitting(false);
        return;
      }
      router.push("/dashboard/reports");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  useEffect(() => {
    // Autosave fires every 30s when dirty. We pass silent=true to avoid
    // noisy errors mid-typing, but if a save fails we still surface it so
    // the user is not lulled by a stale "Saved" timestamp.
    const t = setInterval(async () => {
      if (dirtyRef.current && !locked) {
        const ok = await saveDraft(true);
        if (!ok) {
          setError("Auto-save failed. Click Save draft to retry — your text is still here.");
        }
      }
    }, 30_000);
    return () => clearInterval(t);
  }, [locked]);

  useEffect(() => {
    function beforeUnload(e: BeforeUnloadEvent) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  const isResubmit =
    initialReport &&
    ["SUBMITTED", "UNDER_REVIEW", "GRADED", "FAILED"].includes(initialReport.status);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <Link
          href="/dashboard/reports"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to reports
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {stageLabel} Report
          <span className="text-muted-foreground font-normal"> — {stageSubtitle}</span>
        </h1>
        <div className="mt-2 max-w-3xl space-y-3">
          {missionBrief.map((paragraph, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </header>

      {evidencePack && evidencePack.length > 0 && (
        <section className="mb-6 rounded-xl border border-blue/30 bg-blue/[0.03] p-5">
          <div className="flex items-center gap-2 mb-2">
            <FolderDown className="h-4 w-4 text-blue" />
            <h2 className="font-semibold text-foreground text-base">
              Your evidence pack
            </h2>
            <span className="text-[11px] text-muted-foreground">
              · {evidencePack.length} file{evidencePack.length === 1 ? "" : "s"} to download
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            These are the artefacts the stage gives you. Download each one,
            analyse it locally, and cite specific lines / paths / values
            in your report. The grader will check that your claims tie back
            to these files.
          </p>
          <ul className="space-y-1.5">
            {evidencePack.map((f) => (
              <li key={f.url} className="flex items-start gap-3 rounded-lg border border-border bg-white px-3 py-2.5">
                <Download className="h-4 w-4 text-blue mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={f.url}
                      download
                      className="font-mono text-sm font-medium text-foreground hover:text-blue truncate"
                    >
                      {f.filename}
                    </a>
                    {typeof f.bytes === "number" && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {f.bytes < 1024
                          ? `${f.bytes} B`
                          : `${(f.bytes / 1024).toFixed(1)} KB`}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground leading-snug mt-0.5">
                    {f.description}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-6 rounded-xl border border-border bg-white p-5">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-2">
          Chapter {chapter} · Capstone
        </p>
        <h2 className="font-semibold text-foreground text-lg mb-1.5">
          This is the report that leaves the building.
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          The mission-board tasks tested what you absorbed. This folder is the
          bulk of what we grade — and in the story, it is the package delivered
          to{" "}
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Mail className="h-3.5 w-3.5 text-blue" />
            {reportTo}
          </span>
          .
        </p>
        <div className="rounded-lg bg-muted/40 border border-border p-4">
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-2.5 flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5" />
            Required contents of your folder
          </p>
          <ul className="space-y-2">
            {folderContents.map((item, idx) => (
              <li key={item.id} className="flex gap-2.5 items-start text-sm">
                <span className="shrink-0 grid place-items-center w-5 h-5 rounded bg-foreground text-background text-[10px] font-bold">
                  {idx + 1}
                </span>
                <span className="text-foreground/80 leading-snug">
                  <strong className="text-foreground">{item.title}</strong>{" "}
                  <span className="text-muted-foreground">— {item.deliverable}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-6 bg-blue/5 border border-blue/20 rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue" />
            How to submit your report
          </h2>
          <a
            href="/dashboard/faq"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border border-blue/40 bg-white text-blue hover:bg-blue/10"
          >
            Read the full Deliverables FAQ →
          </a>
        </div>
        <ol className="list-decimal list-inside text-sm text-foreground/80 space-y-1.5 leading-relaxed">
          <li>
            Write each deliverable as a <strong>Google Doc</strong> (or
            Word .docx). PDF still accepted but Docs is recommended — the
            graders read on web, mobile, and tablet, and Docs renders the
            same on all three.
          </li>
          <li>
            Put every deliverable the stage asks for into a single Google
            Drive folder.
          </li>
          <li>
            Right-click the folder → <strong>Share</strong> → set access to{" "}
            <strong>anyone with the link can view</strong>, then copy the folder link.
          </li>
          <li>
            Paste the folder link below, write a short executive summary, and submit.
          </li>
          <li>
            Do not delete, rename, or move files in that folder after submitting — the
            grader may revisit it.
          </li>
        </ol>
        <details className="mt-4">
          <summary className="text-sm font-medium text-blue cursor-pointer">
            Suggested sections for this stage
          </summary>
          <ul className="list-disc list-inside mt-2 text-sm text-foreground/70 space-y-1">
            {sectionHints.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </details>
      </section>


      {initialReport?.feedback && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-amber-900 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Previous grader feedback
          </div>
          {initialReport.score != null && (
            <div className="text-sm text-amber-900 mb-2">
              Score: <strong>{initialReport.score}</strong> / 100
            </div>
          )}
          <div className="text-sm text-amber-900/90 whitespace-pre-wrap">
            {initialReport.feedback}
          </div>
        </div>
      )}

      {locked && (
        <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
          This report is locked — either this stage result has been released or the submission window has closed.
        </div>
      )}

      <div className="space-y-6 bg-white border border-border rounded-xl p-6">
        <section>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Link to your report folder *
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Paste the share link to a <strong>folder</strong> containing everything the
            stage asks for. Set it to <strong>anyone with the link can view</strong> —
            otherwise the grader will not be able to open it.
          </p>
          <input
            type="url"
            value={reportUrl}
            onChange={(e) => {
              setReportUrl(e.target.value);
              setDirty(true);
            }}
            disabled={locked}
            placeholder="https://drive.google.com/drive/folders/…"
            className="w-full p-3 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue/30 disabled:bg-muted/30"
          />
          {reportUrl && isValidUrl(reportUrl) && (
            <a
              href={reportUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 inline-flex items-center gap-1 text-xs text-blue hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> Open folder in new tab to verify sharing
            </a>
          )}
        </section>

        <section>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Executive summary *{" "}
            <span className="text-muted-foreground font-normal">
              ({execWordCount} words ·{" "}
              <span
                className={
                  charsOverLimit
                    ? "text-rose-700 font-semibold"
                    : charsApproachingLimit
                    ? "text-amber-700 font-semibold"
                    : ""
                }
              >
                {execCharCount} / {EXEC_MAX_CHARS} chars
              </span>
              )
            </span>
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Three to five short paragraphs so the grader can skim your argument before
            opening the folder. A non-technical reader should finish this knowing what
            happened, why it matters, and what you recommend.
          </p>
          <textarea
            value={execSummary}
            onChange={(e) => {
              setExecSummary(e.target.value);
              setDirty(true);
            }}
            disabled={locked}
            placeholder="Summarise your findings for a board-level reader…"
            className={`w-full min-h-[220px] p-3 border rounded-lg bg-white text-sm leading-relaxed focus:outline-none focus:ring-2 disabled:bg-muted/30 ${
              charsOverLimit
                ? "border-rose-400 focus:ring-rose-200"
                : "border-border focus:ring-blue/30"
            }`}
          />
          {charsOverLimit && (
            <p className="mt-1 text-xs text-rose-700">
              Over the {EXEC_MAX_CHARS}-character limit. Trim {execCharCount - EXEC_MAX_CHARS} character{execCharCount - EXEC_MAX_CHARS === 1 ? "" : "s"} before submitting.
            </p>
          )}
        </section>

        <section>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Additional attachment{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            A second link — a diagram, a spreadsheet, a supporting file. Only paste
            one more if it&apos;s genuinely relevant.
          </p>
          <input
            type="url"
            value={attachmentUrl}
            onChange={(e) => {
              setAttachmentUrl(e.target.value);
              setDirty(true);
            }}
            disabled={locked}
            placeholder="https://…"
            className="w-full p-3 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue/30 disabled:bg-muted/30"
          />
        </section>

        {error === "__SESSION_EXPIRED__" ? (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-900">
            <span className="flex-1 min-w-[220px] leading-relaxed">
              Your session has expired. Log in again to save and submit — your
              draft text is still here in this tab and will not be lost.
            </span>
            <a
              href={`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/dashboard")}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs whitespace-nowrap"
            >
              Log in again
            </a>
          </div>
        ) : error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
            {error}
          </div>
        )}

        {saving && (
          <div className="flex items-center gap-1.5 text-xs text-blue">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving…
          </div>
        )}
        {!saving && lastSavedAt && !dirty && !error && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Saved at {lastSavedAt.toLocaleTimeString()}
          </div>
        )}
        {!saving && dirty && lastSavedAt && (
          <div className="flex items-center gap-1.5 text-xs text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            Unsaved changes — auto-saves every 30s. Click Save draft to save now.
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button
            onClick={() => saveDraft(false)}
            disabled={saving || locked || !dirty}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-white hover:bg-muted/50 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save draft
          </button>
          <button
            onClick={submitReport}
            disabled={submitting || locked}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isResubmit ? "Resubmit for grading" : "Submit for grading"}
          </button>
          <span className="text-xs text-muted-foreground ml-auto">
            Drafts autosave every 30 seconds.
          </span>
        </div>
      </div>
    </div>
  );
}

function isValidUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return /^https?:$/.test(u.protocol);
  } catch {
    return false;
  }
}
