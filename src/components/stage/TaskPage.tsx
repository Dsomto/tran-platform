"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TaskWidget from "@/components/widgets/TaskWidget";
import type { WidgetKind, TaskContext } from "@/components/widgets/types";
import type { StageTheme } from "./StageShell";

export type TaskPageProps = {
  theme: StageTheme;
  taskId: string;
  order: number;
  title: string;
  briefing: string;           // markdown-ish text
  kind: "FLAG" | "WRITEUP" | "UPLOAD" | "MULTIPLE_CHOICE";
  widgetKind: WidgetKind;
  widgetConfig: Record<string, unknown> | null;
  maxPoints: number;
  context: TaskContext;
  initial?: {
    score?: number | null;
    status?: string | null;
    feedback?: string | null;
  };
};

export default function TaskPageClient(props: TaskPageProps) {
  const router = useRouter();
  const [answer, setAnswer] = useState<Record<string, unknown>>({});
  const [flag, setFlag] = useState("");
  const [writeup, setWriteup] = useState("");
  const [uploadUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number | null; status: string; feedback: string | null } | null>(
    props.initial?.score != null
      ? {
          score: props.initial.score,
          status: props.initial.status ?? "GRADED",
          feedback: props.initial.feedback ?? null,
        }
      : null
  );

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      const payload: Record<string, unknown> = { ...answer };
      if (props.kind === "FLAG") payload.flag = flag || (answer.flag as string) || "";
      if (props.kind === "MULTIPLE_CHOICE") {
        payload.choiceIndex = typeof answer.choiceIndex === "number" ? answer.choiceIndex : -1;
      }
      if (props.kind === "WRITEUP") payload.text = writeup || (answer.text as string) || "";
      if (props.kind === "UPLOAD") {
        payload.url = uploadUrl ?? (answer.url as string) ?? "";
        payload.text = (answer.text as string) ?? "";
      }

      const res = await fetch(`/api/stage/${props.theme.slug}/tasks/${props.taskId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: payload }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error ?? "Submission failed");
      } else {
        setResult({ score: j.score ?? null, status: j.status ?? "SUBMITTED", feedback: j.feedback ?? null });
        router.refresh();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  const accent = props.theme.accentHex;

  return (
    <article className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-white/50">Task {String(props.order).padStart(2, "0")}</div>
          <h1 className="text-2xl font-bold mt-1">{props.title}</h1>
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0"
          style={{ backgroundColor: `${accent}22`, color: accent, border: `1px solid ${accent}44` }}
        >
          {props.maxPoints} pts
        </div>
      </header>

      <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
          {props.briefing}
        </div>
      </section>

      <section>
        <TaskWidget
          kind={props.widgetKind}
          config={props.widgetConfig}
          context={props.context}
          onAnswerChange={setAnswer}
        />
      </section>

      <section className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3">
        <h3 className="text-sm font-semibold text-white/70">Your answer</h3>
        {props.kind === "FLAG" && (
          <input
            value={flag}
            onChange={(e) => setFlag(e.target.value)}
            placeholder="TRAN{…}"
            className="w-full bg-black/60 rounded-lg p-3 border border-white/10 outline-none font-mono"
          />
        )}
        {props.kind === "MULTIPLE_CHOICE" && (
          <div className="text-sm text-white/60">
            {typeof answer.choiceIndex === "number"
              ? `Selected: option ${String.fromCharCode(65 + (answer.choiceIndex as number))}`
              : "Pick an option in the quiz widget above."}
          </div>
        )}
        {props.kind === "WRITEUP" && (
          <textarea
            value={writeup}
            onChange={(e) => setWriteup(e.target.value)}
            placeholder="Paste or compose your writeup here (or use the Writeup Pad widget above)…"
            className="w-full h-36 bg-black/60 rounded-lg p-3 border border-white/10 outline-none font-mono text-sm"
          />
        )}
        {props.kind === "UPLOAD" && (
          <div className="text-sm text-white/60">
            {uploadUrl ? `Attached: ${uploadUrl}` : "Use the upload widget above to attach your file."}
          </div>
        )}
        {err && (
          <div className="text-sm text-red-300 bg-red-500/10 rounded-lg p-2.5 border border-red-500/20">{err}</div>
        )}
        {result && (
          <div className="rounded-lg p-3" style={{ backgroundColor: `${accent}18`, color: accent, border: `1px solid ${accent}33` }}>
            <div className="text-xs uppercase tracking-wider opacity-70">Result</div>
            <div className="font-semibold mt-1">
              {result.status}
              {result.score != null && ` — ${result.score}/${props.maxPoints}`}
            </div>
            {result.feedback && <div className="text-sm opacity-80 mt-1">{result.feedback}</div>}
          </div>
        )}
        <button
          onClick={submit}
          disabled={busy}
          className="px-5 py-3 rounded-lg font-semibold transition disabled:opacity-50"
          style={{ backgroundColor: accent, color: "#0B1120" }}
        >
          {busy ? "Submitting…" : "Submit answer"}
        </button>
      </section>
    </article>
  );
}

