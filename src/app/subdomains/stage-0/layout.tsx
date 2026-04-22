import type { ReactNode } from "react";
import "./theme.css";

export const metadata = {
  title: "Stage 0 — Induction at the Gate · TRAN",
};

export default function Stage0Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111111] relative">
      <div className="stage-0-rain" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
