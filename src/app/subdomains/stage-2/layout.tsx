import type { ReactNode } from "react";
import "./theme.css";

export const metadata = {
  title: "Stage 2 — The Attack Surface · TRAN",
};

export default function Stage2Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#1c0a13] text-[#fecdd3] relative">
      <div className="stage-2-field" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
