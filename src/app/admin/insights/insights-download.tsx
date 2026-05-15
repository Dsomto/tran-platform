"use client";

import { Download } from "lucide-react";

// One labelled block in the exported file — a title followed by label,value rows.
export interface ExportSection {
  title: string;
  rows: [string, string | number][];
}

// Client-side CSV builder. The server page already computed every figure, so
// the download is a pure in-browser serialization — no extra round-trip.
export function InsightsDownload({ sections }: { sections: ExportSection[] }) {
  function handleDownload() {
    const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines: string[] = [
      esc(`Programme Insights — exported ${new Date().toLocaleString()}`),
      "",
    ];
    for (const s of sections) {
      lines.push(esc(s.title));
      for (const [label, value] of s.rows) {
        lines.push(`${esc(label)},${esc(value)}`);
      }
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ubi-insights-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-border bg-white hover:bg-muted/50"
    >
      <Download className="h-4 w-4" />
      Download CSV
    </button>
  );
}
