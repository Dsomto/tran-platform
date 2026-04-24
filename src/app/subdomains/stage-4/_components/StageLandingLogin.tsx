"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { stageUrl } from "@/lib/stage-routes";
import { ArrowRight, BookOpen, ExternalLink, Compass } from "lucide-react";
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
        router.push(stageUrl(theme.slug));
        router.refresh();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unable to authenticate");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050812] text-cyan-50 relative overflow-hidden">
      <div className="stage-4-field" aria-hidden="true" />

      <header className="relative z-10 border-b border-cyan-400/15 bg-[#050812]/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 grid place-items-center text-sm font-bold bg-cyan-400/10 text-cyan-300 border border-cyan-400/40 rounded-sm">
              {theme.logoGlyph}
            </div>
            <div className="leading-tight">
              <div
                className="font-semibold text-cyan-200"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {theme.name}
              </div>
              <div className="text-[10px] text-cyan-200/55 font-mono uppercase tracking-[0.2em]">
                {theme.codename}
              </div>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.15em] text-cyan-200/65 hover:text-cyan-200 transition font-mono"
          >
            ← exit briefing
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-5 py-14 sm:py-20">
        <div className="flex items-center justify-between mb-10 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="stage-4-pill">FINALE</span>
            <span className="stage-4-pill">CAPSTONE</span>
            <span className="stage-4-pill">AUDIENCE · BOARD</span>
          </div>
          <span className="stage-4-stamp">Sankofa Digital · Private Session</span>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          <div className="lg:col-span-3 space-y-12">
            <div>
              <p className="stage-4-heading-mono mb-4">
                {theme.codename}
              </p>
              <h1
                className="stage-4-heading"
                style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.02 }}
              >
                {theme.name}.
              </h1>
              <p
                className="mt-5 text-xl text-cyan-100/85 leading-relaxed"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {tagline}
              </p>
            </div>

            <section>
              <div className="stage-4-rule"><span>§ THE STORY SO FAR</span></div>
              <div
                className="space-y-4 text-[15.5px] text-cyan-50/85 leading-[1.75]"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {storyline.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>

            <section>
              <div className="stage-4-rule"><span>§ THE SYLLABUS</span></div>
              <ol className="space-y-2.5">
                {topics.map((t, i) => (
                  <li
                    key={t}
                    className="flex items-start gap-4 px-4 py-3 bg-cyan-950/30 border border-cyan-400/15 rounded-sm text-[14px] text-cyan-50/90"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    <span className="stage-4-coord shrink-0 mt-0.5 min-w-[2rem]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <div className="stage-4-rule">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-3 h-3" />
                  § PRE-READING
                </span>
              </div>
              <ul className="space-y-2">
                {readings.map((r) => (
                  <li key={r.href}>
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between gap-3 px-4 py-3 bg-[#070d1e] border border-cyan-400/15 hover:border-cyan-400/45 transition rounded-sm"
                    >
                      <span
                        className="text-[14px] text-cyan-50/85 group-hover:text-cyan-200"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {r.label}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400/60 group-hover:text-cyan-300 transition" />
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
                className="stage-4-panel p-6 sm:p-7 space-y-5"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Compass className="w-4 h-4 text-cyan-300" />
                    <h3 className="stage-4-heading text-xl">Take your seat</h3>
                  </div>
                  <p
                    className="text-[13px] text-cyan-100/70 leading-relaxed"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    The chair opens the session at 09:00. Your intern ID is on the
                    seating plan. The two-layer password is in your dispatch.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="stage-4-kpi-label block mb-1.5">
                      INTERN ID
                    </label>
                    <input
                      value={internCode}
                      onChange={(e) => setInternCode(e.target.value)}
                      placeholder="UBI-2026-0001"
                      className="w-full bg-[#030610]/80 border border-cyan-400/25 rounded-sm p-3 outline-none focus:border-cyan-300/70 focus:ring-1 focus:ring-cyan-300/40 text-cyan-50 placeholder:text-cyan-200/30 text-sm font-mono caret-cyan-300"
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="stage-4-kpi-label block mb-1.5">
                      STAGE PASSWORD
                    </label>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={example}
                      className="w-full bg-[#030610]/80 border border-cyan-400/25 rounded-sm p-3 outline-none focus:border-cyan-300/70 focus:ring-1 focus:ring-cyan-300/40 text-cyan-50 placeholder:text-cyan-200/30 text-sm font-mono caret-cyan-300"
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>

                {err && (
                  <div className="text-[13px] text-red-200 bg-red-950/30 border border-red-500/40 rounded-sm p-3">
                    <span className="font-bold uppercase tracking-widest text-[10px] font-mono mr-1.5">
                      Admission refused ·
                    </span>
                    {err}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3.5 rounded-sm font-bold uppercase tracking-[0.2em] text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 border border-cyan-200 font-mono"
                >
                  {busy ? "AUTHENTICATING…" : (
                    <>
                      ENTER BOARDROOM
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p
                className="text-center text-[12px] text-cyan-200/55 mt-4 leading-relaxed"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Use the same password you sign in with on the dashboard.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-cyan-400/12 mt-16 py-7">
        <div className="max-w-6xl mx-auto px-5 text-center text-[10.5px] text-cyan-200/45 uppercase tracking-[0.25em] font-mono">
          TRAN · Operation Root Access · {theme.codename}
        </div>
      </footer>
    </div>
  );
}
