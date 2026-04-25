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
} from "lucide-react";

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

interface WindowInfo {
  passingScore: number;
  isOpen: boolean;
}

interface Props {
  stage: string;
  stageLabel: string;
  stageSubtitle: string;
  storyline: string;
  sectionHints: string[];
  initialReport: InitialReport | null;
  windowInfo: WindowInfo | null;
  locked: boolean;
}

export function ReportEditor({
  stage,
  stageLabel,
  stageSubtitle,
  storyline,
  sectionHints,
  initialReport,
  windowInfo,
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
        if (!silent) setError(data.error || "Failed to save");
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
    if (!isValidUrl(reportUrl)) {
      setError("Paste a valid link to your report folder (Google Drive, Dropbox, etc.).");
      return;
    }
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
        setError(data.error || "Failed to submit");
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
    const t = setInterval(() => {
      if (dirtyRef.current && !locked) saveDraft(true);
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
        <p className="text-muted-foreground mt-2 leading-relaxed max-w-3xl">{storyline}</p>
      </header>

      <section className="mb-6 bg-blue/5 border border-blue/20 rounded-xl p-5">
        <h2 className="font-semibold text-foreground flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-blue" />
          How to submit your report
        </h2>
        <ol className="list-decimal list-inside text-sm text-foreground/80 space-y-1.5 leading-relaxed">
          <li>
            Put every file the stage asks for into a single Google Drive folder
            (or a shared folder on Dropbox / OneDrive).
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
          This report is locked — either you have passed this stage or the submission window has closed.
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
              ({execWordCount} words)
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
            className="w-full min-h-[220px] p-3 border border-border rounded-lg bg-white text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue/30 disabled:bg-muted/30"
          />
        </section>

        <section>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Additional attachment{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            A second link — a diagram, a spreadsheet, a supporting file. Only paste
            one more if it's genuinely relevant.
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

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
            {error}
          </div>
        )}

        {lastSavedAt && !dirty && !error && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Saved at {lastSavedAt.toLocaleTimeString()}
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
