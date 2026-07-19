"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";

type Props = {
  submitUntil: string;
  activeFrom?: string | null;
  tone?: "light" | "dark";
  className?: string;
};

const WAT_FORMATTER = new Intl.DateTimeFormat("en-NG", {
  timeZone: "Africa/Lagos",
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function countdownParts(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return [
    { value: days, label: "days" },
    { value: hours, label: "hours" },
    { value: minutes, label: "minutes" },
    { value: seconds, label: "seconds" },
  ];
}

export function StageDeadlineCountdown({
  submitUntil,
  activeFrom = null,
  tone = "light",
  className = "",
}: Props) {
  const [now, setNow] = useState<number | null>(null);
  const deadline = useMemo(() => new Date(submitUntil), [submitUntil]);
  const opensAt = useMemo(() => activeFrom ? new Date(activeFrom) : null, [activeFrom]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (Number.isNaN(deadline.getTime())) return null;

  const remaining = now === null ? null : deadline.getTime() - now;
  const closed = remaining !== null && remaining <= 0;
  const scheduled = now !== null && opensAt !== null && opensAt.getTime() > now;
  const parts = countdownParts(remaining ?? deadline.getTime());
  const dark = tone === "dark";

  return (
    <section
      className={`${className} flex flex-col gap-3 border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
        dark
          ? "border-white/20 bg-black/25 text-white"
          : "border-blue/25 bg-blue/5 text-foreground"
      }`}
      aria-label="Advanced-stage submission deadline"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Clock3 className={`h-5 w-5 shrink-0 ${dark ? "text-cyan-300" : "text-blue"}`} aria-hidden="true" />
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase ${dark ? "text-white/60" : "text-muted-foreground"}`}>
            {closed ? "Submission window closed" : "Submission closes in"}
          </p>
          <p className="text-sm font-semibold">
            Friday deadline: {WAT_FORMATTER.format(deadline)} WAT
          </p>
          {scheduled && opensAt && (
            <p className={`text-xs ${dark ? "text-white/60" : "text-muted-foreground"}`}>
              Stage opens {WAT_FORMATTER.format(opensAt)} WAT.
            </p>
          )}
        </div>
      </div>

      {!closed && (
        <div className="grid grid-cols-4 gap-2" aria-live="polite" aria-atomic="true">
          {parts.map((part) => (
            <div key={part.label} className="min-w-14 text-center">
              <strong className="block font-mono text-lg tabular-nums">
                {now === null ? "--" : String(part.value).padStart(2, "0")}
              </strong>
              <span className={`block text-[10px] uppercase ${dark ? "text-white/55" : "text-muted-foreground"}`}>
                {part.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
