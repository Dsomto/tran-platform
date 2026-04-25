"use client";

import { Printer } from "lucide-react";

// Triggers the browser's native print dialog on the current page. Pair with
// a print stylesheet (see globals.css) to hide nav/CTAs and show only the
// brief content.
export function PrintBriefButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={className}
    >
      <Printer className="w-4 h-4" />
      Print or save as PDF
    </button>
  );
}
