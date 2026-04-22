import type { ReactNode } from "react";
import "./theme.css";

export const metadata = {
  title: "Stage 1 — Ciphers & Secrets · TRAN",
};

export default function Stage1Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111111] relative">
      <div className="stage-1-field" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
