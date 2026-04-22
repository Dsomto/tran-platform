import Link from "next/link";
import { ReactNode } from "react";

export type StageTheme = {
  slug: "stage-0" | "stage-1" | "stage-2" | "stage-3" | "stage-4";
  name: string;                 // "Induction at the Gate"
  codename: string;             // "Operation Root Access — Chapter 1"
  accent: string;               // tailwind color token e.g. "emerald"
  accentHex: string;            // hex for arbitrary CSS
  backgroundClass: string;      // one of bg-stage-* (defined per stage)
  logoGlyph: string;            // short text badge e.g. "◆0" or "S1"
};

export default function StageShell({
  theme,
  children,
  internCode,
  rightNav,
}: {
  theme: StageTheme;
  children: ReactNode;
  internCode?: string;
  rightNav?: ReactNode;
}) {
  return (
    <div className={`min-h-screen text-white ${theme.backgroundClass}`}>
      <header className="border-b border-white/10 backdrop-blur-md bg-black/30 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl grid place-items-center font-bold text-sm"
              style={{ backgroundColor: `${theme.accentHex}22`, color: theme.accentHex, border: `1px solid ${theme.accentHex}55` }}
            >
              {theme.logoGlyph}
            </div>
            <div className="leading-tight">
              <div className="font-semibold">{theme.name}</div>
              <div className="text-[11px] text-white/50 font-mono">{theme.codename}</div>
            </div>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            {internCode && (
              <span className="hidden md:inline px-2 py-1 rounded-lg bg-white/5 text-white/70 font-mono">
                {internCode}
              </span>
            )}
            {rightNav}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-5 py-8">{children}</main>
      <footer className="border-t border-white/10 mt-16 py-6 text-center text-xs text-white/40">
        TRAN · Operation Root Access · {theme.codename}
      </footer>
    </div>
  );
}
