"use client";

import { useEffect, useState } from "react";
import type { WidgetProps } from "./types";
import { computeFlagBrowser } from "./flag-browser";

/**
 * Shows a per-intern downloadable artefact card.
 *
 * config shape:
 * {
 *   filename: "evidence.log",
 *   label?: "Download evidence bundle",
 *   description?: string,
 *   mimeType?: string,                  // default text/plain
 *   body: string,                       // text contents, supports {flag}
 * }
 */

type Config = { filename?: string; label?: string; description?: string; mimeType?: string; body?: string };

export default function FileDownload({ config, context }: WidgetProps) {
  const c = (config as Config) ?? {};
  const [flag, setFlag] = useState<string | null>(null);
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let currentUrl: string | null = null;
    (async () => {
      const f = context.flagSalt
        ? await computeFlagBrowser(context.flagSalt, context.internId)
        : "TRAN{unknown}";
      if (cancelled) return;
      setFlag(f);
      const body = (c.body ?? "").replace(/\{flag\}/g, f).replace(/\{internCode\}/g, context.internCode);
      const blob = new Blob([body], { type: c.mimeType ?? "text/plain" });
      const url = URL.createObjectURL(blob);
      currentUrl = url;
      setHref(url);
    })();
    return () => {
      cancelled = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [context.flagSalt, context.internId, context.internCode, c.body, c.mimeType]);

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-950/40 to-slate-950 text-white p-6">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-white/10 grid place-items-center text-2xl">📄</div>
        <div className="flex-1">
          <h4 className="font-semibold">{c.label ?? "Download artefact"}</h4>
          <p className="text-white/60 text-sm">{c.description ?? "Signed per-intern file."}</p>
          <div className="mt-2 text-xs font-mono text-white/40 break-all">
            {c.filename ?? "artefact.txt"} · {context.internCode}
          </div>
        </div>
        {href && (
          <a
            href={href}
            download={c.filename ?? "artefact.txt"}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-sm font-semibold self-start"
          >
            Download
          </a>
        )}
      </div>
      {flag && <div className="mt-4 text-[11px] text-white/30 font-mono">flag embedded · per-intern</div>}
    </div>
  );
}
