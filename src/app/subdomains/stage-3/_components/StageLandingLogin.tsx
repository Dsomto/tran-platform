"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, ExternalLink, Fingerprint } from "lucide-react";
import type { StageTheme } from "@/components/stage/StageShell";

type Reading = { label: string; href: string };

type Props = {
  theme: StageTheme;
  rule: string;
  example: string;
  tagline: string;
  storyline: string[];
  topics: string[];
  readings: Reading[];
};

export default function StageLandingLogin({
  theme,
  example,
  tagline,
  storyline,
  topics,
  readings,
}: Props) {
  const router = useRouter();
  const [internCode, setInternCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/stage-login/${theme.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internCode: internCode.trim().toUpperCase(), password }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error ?? "Unable to authenticate");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unable to authenticate");
    } finally {
      setBusy(false);
    }
  }

  const ts = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";

  return (
    <div className="min-h-screen bg-[#070503] text-amber-100 font-mono relative overflow-hidden">
      <div className="stage-3-field" aria-hidden="true" />

      <header className="relative z-10 border-b border-amber-500/20 bg-black/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 grid place-items-center text-sm font-bold bg-amber-500/10 text-amber-300 border border-amber-500/40 rounded-sm">
              {theme.logoGlyph}
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-amber-300 uppercase tracking-[0.15em] text-sm">
                {theme.name}
              </div>
              <div className="text-[10px] text-amber-200/55 uppercase tracking-[0.2em]">
                {theme.codename}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden sm:inline text-[10.5px] uppercase tracking-[0.2em] text-amber-200/55">
              {ts}
            </span>
            <Link
              href="/"
              className="text-xs uppercase tracking-[0.15em] text-amber-200/65 hover:text-amber-200 transition"
            >
              ← exit
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-5 py-12 sm:py-16">
        <div className="flex items-center justify-between mb-10 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="stage-3-pill">CASE · INSIDE_THE_WALLS</span>
            <span className="stage-3-pill">CLEARANCE · INTERN</span>
            <span className="stage-3-pill">CHAPTER 04</span>
          </div>
          <span className="stage-3-stamp">EYES-ONLY · SCIF</span>
        </div>

        <div className="grid lg:grid-cols-5 gap-10 lg:gap-14">
          <div className="lg:col-span-3 space-y-10">
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.25em] text-amber-400/70 mb-3">
                {theme.codename}
              </p>
              <h1 className="stage-3-heading text-4xl sm:text-5xl leading-[1.05]">
                {theme.name}
              </h1>
              <p className="mt-4 text-base text-amber-100/75 leading-relaxed font-sans">
                {tagline}
              </p>
            </div>

            <section>
              <div className="stage-3-divider"><span>§ STORYLINE</span></div>
              <div className="space-y-4 text-[14.5px] text-amber-50/80 leading-relaxed font-sans">
                {storyline.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>

            <section>
              <div className="stage-3-divider"><span>§ WHAT YOU WILL COVER</span></div>
              <ul className="grid sm:grid-cols-2 gap-2">
                {topics.map((t) => (
                  <li
                    key={t}
                    className="flex items-start gap-3 px-3.5 py-3 bg-amber-950/30 border border-amber-500/15 text-[13px] text-amber-100/85 font-sans rounded-sm"
                  >
                    <span className="mt-1 font-mono text-[11px] text-amber-400/70 tracking-wider">›</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <div className="stage-3-divider">
                <span className="flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  § PRIMERS
                </span>
              </div>
              <ul className="space-y-2">
                {readings.map((r) => (
                  <li key={r.href}>
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between gap-3 px-4 py-3 bg-black/40 border border-amber-500/15 hover:border-amber-500/40 transition rounded-sm"
                    >
                      <span className="text-[13.5px] text-amber-100/85 group-hover:text-amber-200 font-sans">
                        {r.label}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-amber-300/50 group-hover:text-amber-300 transition" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-8">
              <form
                onSubmit={submit}
                className="stage-3-panel p-6 sm:p-7 space-y-5"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
                    <h3 className="stage-3-heading text-sm">
                      Authorisation required
                    </h3>
                  </div>
                  <p className="text-xs text-amber-200/60 font-sans leading-relaxed">
                    This room contains artefacts from an active investigation. Your
                    intern ID is logged on entry.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="text-[10.5px] uppercase tracking-[0.2em] text-amber-400/70 mb-1.5 block">
                      INTERN ID
                    </label>
                    <input
                      value={internCode}
                      onChange={(e) => setInternCode(e.target.value)}
                      placeholder="UBI-2026-0001"
                      className="w-full bg-black/50 border border-amber-500/25 rounded-sm p-3 outline-none focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/40 text-amber-100 placeholder:text-amber-200/30 text-sm font-mono caret-amber-400"
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] uppercase tracking-[0.2em] text-amber-400/70 mb-1.5 block">
                      STAGE PASSWORD
                    </label>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={example}
                      className="w-full bg-black/50 border border-amber-500/25 rounded-sm p-3 outline-none focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/40 text-amber-100 placeholder:text-amber-200/30 text-sm font-mono caret-amber-400"
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>

                {err && (
                  <div className="text-xs text-red-300 bg-red-950/30 border border-red-500/40 rounded-sm p-3 font-sans">
                    <span className="font-bold uppercase tracking-wider">ACCESS DENIED</span> · {err}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 rounded-sm font-bold uppercase tracking-[0.2em] text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black border border-amber-300"
                >
                  {busy ? "VERIFYING…" : (
                    <>
                      ENTER SCIF
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-[11px] text-amber-200/45 mt-4 leading-relaxed font-sans">
                Use the same password you sign in with on the dashboard.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-amber-500/15 mt-12 py-6">
        <div className="max-w-6xl mx-auto px-5 text-center text-[10.5px] text-amber-200/45 uppercase tracking-[0.25em]">
          TRAN · Operation Root Access · {theme.codename}
        </div>
      </footer>
    </div>
  );
}
