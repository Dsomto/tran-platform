"use client";

import { useState } from "react";
import type { WidgetProps } from "./types";

/**
 * Vercel-Blob-backed uploader. Accepts files per `config.accept` and promotes
 * the returned public URL into the parent's answer draft.
 *
 * config shape:
 * {
 *   accept?: string,        // e.g. ".svg,.png,.pdf,.xlsx,.csv,.mp4"
 *   maxBytes?: number,      // default 25 MiB
 *   label?: string,
 *   helper?: string
 * }
 */

type Config = { accept?: string; maxBytes?: number; label?: string; helper?: string };

export default function DiagramUpload({ config, onAnswerChange }: WidgetProps) {
  const c = (config as Config) ?? {};
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  async function upload(file: File) {
    setErr(null);
    const maxBytes = c.maxBytes ?? 25 * 1024 * 1024;
    if (file.size > maxBytes) {
      setErr(`File too large (max ${Math.round(maxBytes / 1024 / 1024)} MiB).`);
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Upload failed (${res.status})`);
      }
      const j = await res.json();
      setUrl(j.url);
      setName(file.name);
      onAnswerChange?.({ url: j.url, filename: file.name });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-950 text-white p-6">
      <h4 className="font-semibold mb-1">{c.label ?? "Upload your artefact"}</h4>
      {c.helper && <p className="text-sm text-white/60 mb-4">{c.helper}</p>}
      <label
        htmlFor="diagram-upload"
        className="block border border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-white/40 transition"
      >
        <div className="text-white/70 text-sm">{busy ? "Uploading…" : "Click to choose a file or drop it here"}</div>
        <div className="text-xs text-white/40 mt-1">
          {c.accept ?? "any file"} · up to {Math.round((c.maxBytes ?? 25 * 1024 * 1024) / 1024 / 1024)} MiB
        </div>
        <input
          id="diagram-upload"
          type="file"
          accept={c.accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
      </label>
      {err && <div className="mt-3 text-sm text-red-300">{err}</div>}
      {url && (
        <div className="mt-4 bg-black/30 rounded-lg p-3 flex items-center justify-between gap-3 text-sm border border-white/10">
          <div className="min-w-0">
            <div className="font-medium truncate">{name}</div>
            <a href={url} target="_blank" rel="noreferrer" className="text-blue-300 text-xs break-all">
              {url}
            </a>
          </div>
          <div className="shrink-0 text-xs text-emerald-300">uploaded</div>
        </div>
      )}
    </div>
  );
}
