"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { stageUrl } from "@/lib/stage-routes";
import { ArrowRight, BookOpen, ExternalLink } from "lucide-react";
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
    <div className="min-h-screen bg-[#fafafa] text-[#111111]">
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background: `radial-gradient(circle at 18% 12%, ${theme.accentHex}18 0%, transparent 45%), radial-gradient(circle at 88% 88%, ${theme.accentHex}10 0%, transparent 50%)`,
        }}
      />
      <header className="relative z-10 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl grid place-items-center font-bold text-sm"
              style={{
                backgroundColor: `${theme.accentHex}15`,
                color: theme.accentHex,
                border: `1px solid ${theme.accentHex}40`,
              }}
            >
              {theme.logoGlyph}
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-neutral-900">{theme.name}</div>
              <div className="text-[11px] text-neutral-500 font-mono uppercase tracking-wider">
                {theme.codename}
              </div>
            </div>
          </div>
          <Link
            href="/"
            className="text-sm text-neutral-600 hover:text-neutral-900 transition font-medium"
          >
            Back to TRAN
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-5 py-12 sm:py-16">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-14">
          <div className="lg:col-span-3 space-y-10">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em] mb-3"
                style={{ color: theme.accentHex }}
              >
                {theme.codename}
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 leading-[1.05]">
                {theme.name}
              </h1>
              <p className="mt-4 text-lg text-neutral-600 leading-relaxed">{tagline}</p>
            </div>

            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                The storyline
              </h2>
              <div className="space-y-4 text-[15px] text-neutral-700 leading-relaxed">
                {storyline.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 mb-4">
                What you&apos;ll cover
              </h2>
              <ul className="grid sm:grid-cols-2 gap-2.5">
                {topics.map((t) => (
                  <li
                    key={t}
                    className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white border border-neutral-200 text-sm text-neutral-800"
                  >
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: theme.accentHex }}
                    />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 mb-4 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" />
                Primers &amp; reading
              </h2>
              <ul className="space-y-2">
                {readings.map((r) => (
                  <li key={r.href}>
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 transition"
                    >
                      <span className="text-sm text-neutral-800 group-hover:text-neutral-900">
                        {r.label}
                      </span>
                      <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 transition" />
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
                className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-7 shadow-[0_1px_2px_rgba(17,17,17,0.03),_0_8px_32px_rgba(17,17,17,0.06)]"
              >
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-neutral-900">Enter the room</h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    Your intern ID and stage password were emailed to you.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-neutral-700 mb-1.5 block uppercase tracking-wider">
                      Intern ID
                    </label>
                    <input
                      value={internCode}
                      onChange={(e) => setInternCode(e.target.value)}
                      placeholder="UBI-2026-0001"
                      className="w-full bg-white border border-neutral-200 rounded-lg p-3 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 font-mono text-sm text-neutral-900 placeholder:text-neutral-400 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-700 mb-1.5 block uppercase tracking-wider">
                      Stage password
                    </label>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={example}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-3 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 font-mono text-sm text-neutral-900 placeholder:text-neutral-400 transition"
                      required
                    />
                  </div>
                </div>

                {err && (
                  <div className="mt-4 text-sm text-red-700 bg-red-50 rounded-lg p-3 border border-red-200">
                    {err}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full mt-5 py-3 rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 text-white hover:opacity-90"
                  style={{ backgroundColor: theme.accentHex }}
                >
                  {busy ? "Verifying…" : (
                    <>
                      Enter {theme.name}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-neutral-500 mt-4 leading-relaxed">
                Use the same password you sign in with on the dashboard.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-neutral-200 mt-12 py-8">
        <div className="max-w-6xl mx-auto px-5 text-center text-xs text-neutral-500">
          TRAN · Operation Root Access · {theme.codename}
        </div>
      </footer>
    </div>
  );
}
