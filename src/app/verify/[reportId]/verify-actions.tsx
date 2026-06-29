"use client";

import { useState } from "react";
import { Download, Copy, Check } from "lucide-react";
import { LinkedInIcon } from "@/components/icons/linkedin";

export function VerifyActions({
  addToLinkedIn,
  pdfUrl,
  certId,
  verifyUrl,
}: {
  addToLinkedIn: string;
  pdfUrl: string;
  certId: string;
  verifyUrl: string;
}) {
  const [copied, setCopied] = useState("");

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    });
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-wrap gap-3">
        <a
          href={addToLinkedIn}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0A66C2] text-white text-sm font-semibold hover:bg-[#004182] transition"
        >
          <LinkedInIcon className="w-4 h-4" />
          Add to LinkedIn
        </a>
        <a
          href={pdfUrl}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-surface-hover transition"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </a>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <button
          onClick={() => copy(certId, "id")}
          className="inline-flex items-center gap-1.5 text-muted hover:text-foreground transition"
        >
          {copied === "id" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          Copy credential ID
        </button>
        <button
          onClick={() => copy(verifyUrl, "url")}
          className="inline-flex items-center gap-1.5 text-muted hover:text-foreground transition"
        >
          {copied === "url" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          Copy credential URL
        </button>
      </div>
    </div>
  );
}
