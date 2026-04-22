"use client";

import type { WidgetProps } from "./types";

/**
 * Placeholder widget for briefing-only tasks. Renders a note explaining the
 * task is purely narrative + answered via the submission panel below.
 */
export default function NoneWidget({ config }: WidgetProps) {
  const c = (config as { note?: string }) ?? {};
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 text-white/60 p-8 text-center">
      <div className="text-sm">{c.note ?? "Read the briefing and answer below."}</div>
    </div>
  );
}
