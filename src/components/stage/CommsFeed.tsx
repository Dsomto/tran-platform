import { Pin, EyeOff } from "lucide-react";
import type { CommsMessage } from "@/lib/stage-briefs";
import type { StageLandingTheme } from "@/lib/stage-landing-theme";
import { personalise } from "@/lib/stage-story";
import { Reveal } from "./Reveal";

interface Props {
  theme: StageLandingTheme;
  thread: CommsMessage[];
  firstName: string;
}

function alignmentRail(alignment: CommsMessage["alignment"]): string {
  switch (alignment) {
    case "ally":
      return "border-l-4 border-l-emerald-400/70";
    case "peer":
      return "border-l-4 border-l-blue-400/70";
    case "adversary":
      return "border-l-4 border-l-rose-400/70";
    case "external":
      return "border-l-4 border-l-amber-400/70";
    default:
      return "border-l-4 border-l-white/15";
  }
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z]/g, "")[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function CommsItem({
  msg,
  theme,
  firstName,
}: {
  msg: CommsMessage;
  theme: StageLandingTheme;
  firstName: string;
}) {
  const isRedacted = msg.kind === "redacted";
  const railClass = alignmentRail(msg.alignment);

  return (
    <article
      className={`${theme.softBgClass} rounded-r-xl rounded-l-md ${railClass} px-4 sm:px-5 py-3.5 ${
        isRedacted ? "opacity-70" : ""
      }`}
    >
      <header className="flex items-center gap-2.5 flex-wrap mb-1.5">
        <span
          className={`shrink-0 grid place-items-center w-8 h-8 rounded-full font-bold text-[10px] ${theme.ctaBgClass} text-white`}
          aria-hidden="true"
        >
          {initialsOf(msg.from)}
        </span>
        <span className={`${theme.bodyTextClass} text-sm font-semibold`}>{msg.from}</span>
        <span className={`${theme.mutedTextClass} text-[11.5px]`}>{msg.role}</span>
        <span className={`${theme.mutedTextClass} text-[10.5px] ml-auto font-mono`}>{msg.time}</span>
        {msg.kind === "pinned" && (
          <span
            className={`inline-flex items-center gap-1 text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${theme.dividerClass} ${theme.accentTextClass}`}
          >
            <Pin className="w-2.5 h-2.5" />
            pinned
          </span>
        )}
        {isRedacted && (
          <span
            className={`inline-flex items-center gap-1 text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${
              theme.light
                ? "border-rose-300 text-rose-700"
                : "border-rose-400/40 text-rose-300"
            }`}
          >
            <EyeOff className="w-2.5 h-2.5" />
            redacted
          </span>
        )}
      </header>
      <p
        className={`${
          isRedacted ? `${theme.mutedTextClass} italic` : theme.bodyTextClass
        } text-[13.5px] leading-relaxed whitespace-pre-line`}
        style={isRedacted ? undefined : { fontFamily: "Georgia, serif" }}
      >
        {personalise(msg.body, firstName)}
      </p>
    </article>
  );
}

/**
 * Channel-style message thread shown at the very top of Stage 1+ landings.
 * The cast acknowledges the intern's prior-chapter work and seeds the
 * cliffhanger for the next chapter. Pinned messages float to the top in
 * the order they appear in the thread; regular messages render in source
 * order beneath them.
 *
 * Stage 0 omits the section (no prior chapter to react to).
 */
export function CommsFeed({ theme, thread, firstName }: Props) {
  if (!thread || thread.length === 0) return null;

  const pinned = thread.filter((m) => m.kind === "pinned");
  const rest = thread.filter((m) => m.kind !== "pinned");

  return (
    <section className={`${theme.panelClass} p-5 sm:p-6`}>
      <div
        className={`flex items-center gap-2 mb-4 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}
      >
        <span className="relative flex w-2 h-2" aria-hidden="true">
          <span className={`${theme.ctaBgClass} absolute inset-0 rounded-full opacity-70 animate-ping`} />
          <span className={`${theme.ctaBgClass} relative inline-flex w-2 h-2 rounded-full`} />
        </span>
        #stage-team — your channel
      </div>
      <div className="space-y-3">
        {pinned.map((m, i) => (
          <Reveal key={`p-${i}`} delay={i * 0.07}>
            <CommsItem msg={m} theme={theme} firstName={firstName} />
          </Reveal>
        ))}
        {rest.map((m, i) => (
          <Reveal key={`r-${i}`} delay={(pinned.length + i) * 0.07}>
            <CommsItem msg={m} theme={theme} firstName={firstName} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
