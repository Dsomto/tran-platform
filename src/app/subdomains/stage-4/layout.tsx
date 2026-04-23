import type { ReactNode } from "react";
import "./theme.css";

export const metadata = {
  title: "Stage 4 — The Debrief · TRAN",
};

export default function Stage4Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050812] text-cyan-50 relative">
      <div className="stage-4-field" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
