import type { ReactNode } from "react";
import "./theme.css";

export const metadata = {
  title: "Stage 2 — The Attack Surface · TRAN",
};

export default function Stage2Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111111] relative">
      <div className="stage-2-field" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
