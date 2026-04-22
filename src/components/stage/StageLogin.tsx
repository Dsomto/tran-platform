"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StageTheme } from "./StageShell";

export default function StageLogin({
  theme,
  rule,
  example,
}: {
  theme: StageTheme;
  rule: string;
  example: string;
}) {
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

  return (
    <div className="min-h-screen grid place-items-center px-5 py-12 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${theme.accentHex}55, transparent 50%), radial-gradient(circle at 80% 80%, ${theme.accentHex}22, transparent 55%)`,
        }}
      />
      <div className="relative max-w-md w-full">
        <div className="text-center mb-8">
          <div
            className="inline-flex w-14 h-14 rounded-2xl items-center justify-center font-bold text-xl mb-3"
            style={{ backgroundColor: `${theme.accentHex}22`, color: theme.accentHex, border: `1px solid ${theme.accentHex}55` }}
          >
            {theme.logoGlyph}
          </div>
          <h1 className="text-2xl font-bold">{theme.name}</h1>
          <p className="text-white/50 text-sm">{theme.codename}</p>
        </div>
        <form
          onSubmit={submit}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="text-xs text-white/60 mb-1 block">Intern ID</label>
            <input
              value={internCode}
              onChange={(e) => setInternCode(e.target.value)}
              placeholder="UBI-2026-0001"
              className="w-full bg-black/60 rounded-lg p-3 border border-white/10 outline-none font-mono text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Stage password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={example}
              className="w-full bg-black/60 rounded-lg p-3 border border-white/10 outline-none font-mono text-sm"
              required
            />
            <div
              className="mt-2 text-xs rounded-lg p-2.5"
              style={{ backgroundColor: `${theme.accentHex}15`, color: theme.accentHex }}
            >
              <span className="font-semibold">Encoding rule:</span> {rule}
            </div>
          </div>
          {err && <div className="text-sm text-red-300 bg-red-500/10 rounded-lg p-2.5 border border-red-500/20">{err}</div>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-lg font-semibold transition disabled:opacity-50"
            style={{
              backgroundColor: theme.accentHex,
              color: "#0B1120",
            }}
          >
            {busy ? "Verifying…" : `Enter ${theme.name}`}
          </button>
          <p className="text-[11px] text-white/40 text-center">
            Your stage password was emailed to you. Different stages accept it in different encodings.
          </p>
        </form>
      </div>
    </div>
  );
}
