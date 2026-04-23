import type { ReactNode } from "react";
import "./theme.css";

export const metadata = {
  title: "Stage 3 — Inside the Walls · TRAN",
};

export default function Stage3Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0b0906] text-amber-50 relative">
      <div className="stage-3-field" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
