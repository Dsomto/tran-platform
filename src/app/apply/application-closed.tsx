"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarClock, Lock, ArrowLeft, Bell } from "lucide-react";

type Props = {
  reason: "not_yet_open" | "manually_closed" | "closed_past_deadline";
  opensAt: string | null;
  note: string | null;
};

// Hook that ticks once per second until the target — returns the remaining
// parts. null while awaiting mount (avoids hydration mismatch).
function useCountdown(targetIso: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!targetIso) return;
    const target = new Date(targetIso).getTime();
    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetIso]);

  if (remaining === null) return null;
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, done: remaining === 0 };
}

export function ApplicationClosed({ reason, opensAt, note }: Props) {
  const countdown = useCountdown(reason === "not_yet_open" ? opensAt : null);

  const title =
    reason === "not_yet_open"
      ? "Applications open soon"
      : reason === "closed_past_deadline"
        ? "Applications have closed"
        : "Applications are closed for now";

  const defaultSubtitle =
    reason === "not_yet_open"
      ? "The form is scheduled to open at the time below. Come back then — or bookmark this page."
      : reason === "closed_past_deadline"
        ? "The window for this cohort has closed. Watch this space for the next one."
        : "The programme team has paused applications. Check back shortly.";

  return (
    <section className="relative py-20 sm:py-28 bg-background bg-scan overflow-hidden">
      <div className="hex-grid" aria-hidden="true" />
      <div className="orb orb-blue w-[340px] h-[340px] top-[8%] right-[5%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-cyan w-[200px] h-[200px] bottom-[10%] left-[5%] hidden lg:block" style={{ animationDelay: "-6s" }} aria-hidden="true" />

      <div className="relative z-[1] max-w-2xl mx-auto px-5 sm:px-8 text-center">
        <div className="glass-card-elevated rounded-2xl p-8 sm:p-12">
          <div className="w-14 h-14 rounded-2xl bg-blue/10 grid place-items-center mx-auto mb-5">
            {reason === "not_yet_open" ? (
              <CalendarClock className="w-6 h-6 text-blue" />
            ) : (
              <Lock className="w-6 h-6 text-blue" />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
            {title}
          </h1>
          <p className="text-base text-muted leading-relaxed max-w-lg mx-auto">
            {note || defaultSubtitle}
          </p>

          {reason === "not_yet_open" && opensAt && (
            <>
              <div className="mt-10 grid grid-cols-4 gap-3 sm:gap-4 max-w-md mx-auto">
                {(
                  [
                    ["Days", countdown?.days],
                    ["Hours", countdown?.hours],
                    ["Minutes", countdown?.minutes],
                    ["Seconds", countdown?.seconds],
                  ] as const
                ).map(([label, val]) => (
                  <div
                    key={label}
                    className="bg-white border border-border rounded-xl py-4 px-2 shadow-sm"
                  >
                    <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                      {val === undefined ? "--" : String(val).padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted">
                Opens{" "}
                {new Date(opensAt).toLocaleString(undefined, {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </p>
            </>
          )}

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-foreground border border-border px-6 py-3 rounded-full hover:bg-surface-hover transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to home
            </Link>
            <a
              href="mailto:somtochukwu.okoma@ethnoscyber.com?subject=Notify%20me%20when%20UBI%20applications%20open"
              className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-blue px-6 py-3 rounded-full hover:bg-blue-dark transition-colors"
            >
              <Bell className="w-4 h-4" /> Email me when it opens
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
