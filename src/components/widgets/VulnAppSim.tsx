"use client";

import { useEffect, useMemo, useState } from "react";
import type { WidgetProps } from "./types";
import { computeFlagBrowser, deriveSecretBrowser } from "./flag-browser";

/**
 * Simulated vulnerable web app.
 *
 * config shape (pick ONE scenario at a time):
 * {
 *   scenario: "login" | "search" | "notes" | "import",
 *   triggers: [                           // ordered match table — first hit wins
 *     { match: "' OR '1'='1",             // substring (case-insensitive)
 *       regex?: string,                   // …or full regex
 *       renderKind?: "admin-banner" | "table" | "json" | "text",
 *       response: { ... }                 // shape depends on renderKind
 *     },
 *     ...
 *   ],
 *   fallback: { response: "Login failed." }
 * }
 *
 * Special response fields are templated with {flag} and {secret}.
 */

type Trigger = {
  match?: string;
  regex?: string;
  renderKind?: "admin-banner" | "table" | "json" | "text";
  response: Record<string, unknown>;
};

type Config = {
  scenario?: "login" | "search" | "notes" | "import";
  triggers?: Trigger[];
  fallback?: { response: unknown };
  secretSalt?: string;
  secretLen?: number;
};

export default function VulnAppSim({ config, context, onAnswerChange }: WidgetProps) {
  const c = (config as Config) ?? {};
  const scenario = c.scenario ?? "login";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [matchedHit, setMatchedHit] = useState<Trigger | null>(null);
  const [flag, setFlag] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      if (context.flagSalt) {
        const f = await computeFlagBrowser(context.flagSalt, context.internId);
        if (live) setFlag(f);
      }
      if (c.secretSalt) {
        const s = await deriveSecretBrowser(c.secretSalt, context.internId, c.secretLen ?? 16);
        if (live) setSecret(s);
      }
    })();
    return () => {
      live = false;
    };
  }, [context.flagSalt, context.internId, c.secretSalt, c.secretLen]);

  const activeInput = useMemo(() => {
    switch (scenario) {
      case "login":
        return `${username} ${password}`;
      case "search":
        return query;
      case "notes":
        return note;
      case "import":
        return url;
    }
  }, [scenario, username, password, query, note, url]);

  function checkTriggers(): Trigger | null {
    const triggers = c.triggers ?? [];
    for (const t of triggers) {
      if (t.regex) {
        try {
          if (new RegExp(t.regex, "i").test(activeInput)) return t;
        } catch { /* noop */ }
      }
      if (t.match && activeInput.toLowerCase().includes(t.match.toLowerCase())) {
        return t;
      }
    }
    return null;
  }

  function submit() {
    const hit = checkTriggers();
    setMatchedHit(hit);
    if (hit) {
      const txt = templated(hit.response);
      onAnswerChange?.({ triggered: hit.match ?? hit.regex ?? "matched", output: txt });
    } else {
      const fb = c.fallback?.response;
      if (typeof fb === "string") {
        onAnswerChange?.({ triggered: "fallback", output: fb });
      }
    }
  }

  function templated(obj: unknown): string {
    const raw = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
    return raw
      .replace(/\{flag\}/g, flag ?? "TRAN{pending}")
      .replace(/\{secret\}/g, secret ?? "pending");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 text-white overflow-hidden">
      <div className="px-4 py-2 bg-black/40 border-b border-white/10 text-xs text-white/50 font-mono">
        https://legacy-admin.sankofa.internal/{scenario}
      </div>
      <div className="grid md:grid-cols-2 gap-0">
        <div className="p-6 border-r border-white/10 bg-black/20">
          {scenario === "login" && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Sankofa Admin Login</h4>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full bg-white/5 rounded-lg p-2.5 border border-white/10 outline-none focus:border-white/30 font-mono text-sm"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className="w-full bg-white/5 rounded-lg p-2.5 border border-white/10 outline-none focus:border-white/30 font-mono text-sm"
              />
              <button
                onClick={submit}
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-sm font-semibold"
              >
                Sign in
              </button>
            </div>
          )}
          {scenario === "search" && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Customer search</h4>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search query"
                className="w-full bg-white/5 rounded-lg p-2.5 border border-white/10 outline-none focus:border-white/30 font-mono text-sm"
              />
              <button
                onClick={submit}
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-sm font-semibold"
              >
                Search
              </button>
            </div>
          )}
          {scenario === "notes" && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Post a note</h4>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="write a note…"
                className="w-full h-28 bg-white/5 rounded-lg p-2.5 border border-white/10 outline-none focus:border-white/30 font-mono text-sm"
              />
              <button
                onClick={submit}
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-sm font-semibold"
              >
                Submit
              </button>
            </div>
          )}
          {scenario === "import" && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Import from URL</h4>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className="w-full bg-white/5 rounded-lg p-2.5 border border-white/10 outline-none focus:border-white/30 font-mono text-sm"
              />
              <button
                onClick={submit}
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-sm font-semibold"
              >
                Fetch
              </button>
            </div>
          )}
        </div>
        <div className="p-6 bg-black/40 min-h-[260px]">
          <div className="text-xs text-white/50 mb-2">Server response</div>
          {matchedHit ? (
            <pre className="font-mono text-sm text-emerald-200 whitespace-pre-wrap break-all">
              {templated(matchedHit.response)}
            </pre>
          ) : (
            <pre className="font-mono text-sm text-white/60 whitespace-pre-wrap break-all">
              {c.fallback ? templated(c.fallback.response) : " "}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
