"use client";

import { useEffect, useRef, useState } from "react";
import type { WidgetProps } from "./types";
import { computeFlagBrowser, deriveSecretBrowser } from "./flag-browser";

/**
 * Scripted in-browser terminal.
 *
 * config shape (all optional):
 * {
 *   prompt: "intern@sankofa:~$",
 *   welcome: ["Welcome to Sankofa shell.", "Type `help` to list commands."],
 *   files: {                                 // simulated filesystem
 *     "/home/intern/README.md": "First hidden word is operative.",
 *     "/home/intern/.hidden_flag": { kind: "flag" },   // renders intern flag
 *     "/etc/passwd": "root:x:0:0:..."
 *   },
 *   // commands beyond the built-in pedagogic subset:
 *   commands: {
 *     "ps": { output: "PID  CMD\n1    init\n..." },
 *     "whoami": { output: "intern" }
 *   },
 *   // optional hints when interns get stuck
 *   hints: ["Try `ls -a ~/intro/`", "cat the README"]
 * }
 */

type FileEntry =
  | string
  | { kind: "flag"; salt?: string }
  | { kind: "secret"; salt: string; len?: number };

type TerminalConfig = {
  prompt?: string;
  welcome?: string[];
  /** Starting working directory. Falls back to the longest common directory
   *  in `files` (so labs that seed everything under /staging/* don't strand
   *  the intern in /home/intern with `ls` returning nothing). */
  cwd?: string;
  files?: Record<string, FileEntry>;
  commands?: Record<string, { output?: string; stderr?: string }>;
  hints?: string[];
  // Present on server-verified tasks (T3). When set, the terminal is just the
  // recon scratchpad; the injection itself is submitted to the /verify route via
  // the separate input below, which checks it server-side and returns the flag.
  verify?: { kind?: string };
};

// Pick a sensible default cwd from the seeded files. If the lab seeds
// /staging/* and nothing else, the intern should land in /staging.
function defaultCwd(files: Record<string, FileEntry>): string {
  const HOME = "/home/intern";
  const homeHasFiles = Object.keys(files).some((p) =>
    p.startsWith(`${HOME}/`)
  );
  if (homeHasFiles) return HOME;
  const dirs = Object.keys(files).map((p) => {
    const lastSlash = p.lastIndexOf("/");
    return lastSlash <= 0 ? "/" : p.slice(0, lastSlash);
  });
  if (dirs.length === 0) return HOME;
  // Longest common directory prefix.
  const split = (d: string) => d.split("/").filter(Boolean);
  let common = split(dirs[0]);
  for (let i = 1; i < dirs.length; i += 1) {
    const parts = split(dirs[i]);
    let j = 0;
    while (j < common.length && j < parts.length && common[j] === parts[j]) j += 1;
    common = common.slice(0, j);
    if (common.length === 0) break;
  }
  return common.length ? `/${common.join("/")}` : HOME;
}

const DEFAULT_CONFIG: TerminalConfig = {
  prompt: "intern@sankofa:~$",
  welcome: ["Sankofa Digital · Training Shell", "Type `help` to list supported commands."],
  files: {},
  commands: {},
  hints: [],
};

function normalizePath(cwd: string, input: string): string {
  const home = "/home/intern";
  if (input === "~") return home;
  if (input.startsWith("~/")) return `${home}/${input.slice(2)}`;
  const parts = (input.startsWith("/") ? input : `${cwd}/${input}`).split("/").filter(Boolean);
  const stack: string[] = [];
  for (const p of parts) {
    if (p === "." || p === "") continue;
    if (p === "..") stack.pop();
    else stack.push(p);
  }
  return `/${stack.join("/")}`;
}

function listDir(files: Record<string, FileEntry>, dir: string, showHidden: boolean): string[] {
  const prefix = dir.endsWith("/") ? dir : `${dir}/`;
  const names = new Set<string>();
  for (const path of Object.keys(files)) {
    if (!path.startsWith(prefix)) continue;
    const rest = path.slice(prefix.length);
    const name = rest.split("/")[0];
    if (!name) continue;
    if (!showHidden && name.startsWith(".")) continue;
    names.add(name);
  }
  return Array.from(names).sort();
}

export default function WebTerminal({ config, context, onAnswerChange }: WidgetProps) {
  const c: TerminalConfig = { ...DEFAULT_CONFIG, ...((config as TerminalConfig) ?? {}) };
  const files = c.files ?? {};
  const extraCommands = c.commands ?? {};

  const [history, setHistory] = useState<string[]>([...(c.welcome ?? [])]);
  const [input, setInput] = useState("");
  // Seeded cwd: honour config.cwd if set, else infer from where the lab
  // actually has files. Without this, interns running `ls` immediately
  // see nothing and have to guess that the lab is mounted under /staging.
  const [cwd, setCwd] = useState<string>(c.cwd ?? defaultCwd(files));
  const [past, setPast] = useState<string[]>([]);
  const [pastIdx, setPastIdx] = useState<number>(-1);
  const [flagCache, setFlagCache] = useState<string | null>(null);
  const [injection, setInjection] = useState("");
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [verifyOk, setVerifyOk] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!context.flagSalt) return;
    let live = true;
    computeFlagBrowser(context.flagSalt, context.internId).then((f) => {
      if (live) setFlagCache(f);
    });
    return () => {
      live = false;
    };
  }, [context.flagSalt, context.internId]);

  useEffect(() => {
    // Scroll the terminal's own container, NOT the page. element.scrollIntoView()
    // on mobile can scroll the document body instead of the nearest overflow:auto
    // ancestor, which jumps the viewport past the terminal down to the answer
    // input below — exactly the "press Enter and it carries me to the submission"
    // bug interns reported on phones. Setting scrollTop directly on the scroller
    // keeps the scroll local to the terminal in every browser.
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history]);

  async function resolveFileContents(entry: FileEntry): Promise<string> {
    if (typeof entry === "string") return entry;
    if (entry.kind === "flag") {
      const salt = entry.salt ?? context.flagSalt;
      if (!salt) return "(flag unavailable)";
      const flag = await computeFlagBrowser(salt, context.internId);
      return flag;
    }
    if (entry.kind === "secret") {
      return deriveSecretBrowser(entry.salt, context.internId, entry.len ?? 16);
    }
    return "";
  }

  async function run(line: string): Promise<string[]> {
    const raw = line.trim();
    if (!raw) return [];
    const parts = raw.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    switch (cmd) {
      case "help":
        return [
          "Supported commands:",
          "  ls [-a] [path]          list files",
          "  cd [path]               change directory",
          "  pwd                     print working directory",
          "  cat <file>              print file contents",
          "  echo <text>             print text",
          "  whoami                  current user",
          "  grep <pat> <file>       filter lines",
          "  sha256sum <file>        SHA-256 of file",
          "  base64 [-d] <text>      encode/decode",
          "  hashid <hash>           guess hash type",
          "  chmod <mode> <file>     change permissions (simulated)",
          "  stat <file>             show metadata",
          "  history                 recent commands",
          "  clear                   clear screen",
          "  help                    this message",
          ...Object.keys(extraCommands).map((k) => `  ${k.padEnd(24)}(custom)`),
        ];
      case "clear":
        setHistory([]);
        return [];
      case "pwd":
        return [cwd];
      case "whoami":
        return [extraCommands.whoami?.output ?? "intern"];
      case "history":
        return past.slice(-20).map((c, i) => `${i + 1}  ${c}`);
      case "echo":
        return [args.join(" ")];
      case "ls": {
        const showHidden = args.includes("-a") || args.includes("-la") || args.includes("-al");
        const target = args.find((a) => !a.startsWith("-")) ?? cwd;
        const abs = normalizePath(cwd, target);
        const names = listDir(files, abs, showHidden);
        if (names.length === 0) {
          // Distinguish 'directory exists but empty' from 'doesn't exist at
          // all'. Either way, give the intern a useful hint about where the
          // lab files actually live so they're not stuck guessing.
          const validDir = Object.keys(files).some((p) => p.startsWith(`${abs}/`));
          const allDirs = new Set<string>();
          for (const p of Object.keys(files)) {
            const lastSlash = p.lastIndexOf("/");
            const d = lastSlash <= 0 ? "/" : p.slice(0, lastSlash);
            allDirs.add(d);
          }
          const hint = allDirs.size
            ? `  hint: try \`ls ${[...allDirs][0]}\``
            : "";
          if (validDir) return [`ls: ${target}: (empty)${hint ? "\n" + hint : ""}`];
          return [`ls: ${target}: no such file or directory${hint ? "\n" + hint : ""}`];
        }
        return [names.join("  ")];
      }
      case "cd": {
        const target = args[0] ?? "~";
        const abs = normalizePath(cwd, target);
        const hasChildren = Object.keys(files).some((p) => p.startsWith(`${abs}/`));
        if (!hasChildren && !(abs === "/home/intern" || abs === "/")) {
          return [`cd: ${target}: no such file or directory`];
        }
        setCwd(abs);
        return [];
      }
      case "cat": {
        if (args.length === 0) return ["cat: missing operand"];
        const abs = normalizePath(cwd, args[0]);
        const entry = files[abs];
        if (entry == null) return [`cat: ${args[0]}: no such file or directory`];
        const contents = await resolveFileContents(entry);
        return contents.split("\n");
      }
      case "grep": {
        if (args.length < 2) return ["grep: usage: grep <pattern> <file>"];
        const pat = args[0];
        const abs = normalizePath(cwd, args[args.length - 1]);
        const entry = files[abs];
        if (entry == null) return [`grep: ${args[args.length - 1]}: no such file or directory`];
        const contents = await resolveFileContents(entry);
        try {
          const re = new RegExp(pat);
          return contents.split("\n").filter((l) => re.test(l));
        } catch {
          return [`grep: invalid pattern: ${pat}`];
        }
      }
      case "sha256sum": {
        if (args.length === 0) return ["sha256sum: missing operand"];
        const abs = normalizePath(cwd, args[0]);
        const entry = files[abs];
        if (entry == null) return [`sha256sum: ${args[0]}: no such file or directory`];
        const contents = await resolveFileContents(entry);
        const buf = new TextEncoder().encode(contents);
        const hash = await crypto.subtle.digest("SHA-256", buf);
        const hex = Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
        return [`${hex}  ${args[0]}`];
      }
      case "base64": {
        const decode = args[0] === "-d" || args[0] === "--decode";
        const payload = decode ? args.slice(1).join(" ") : args.join(" ");
        if (!payload) return ["base64: missing operand"];
        try {
          if (decode) return [atob(payload)];
          return [btoa(payload)];
        } catch {
          return ["base64: invalid input"];
        }
      }
      case "hashid": {
        const h = args[0] ?? "";
        if (!h) return ["hashid: missing operand"];
        if (/^\$2[aby]\$/.test(h)) return ["bcrypt"];
        if (h.length === 32 && /^[a-f0-9]+$/i.test(h)) return ["MD5 (possible)"];
        if (h.length === 40 && /^[a-f0-9]+$/i.test(h)) return ["SHA-1 (possible)"];
        if (h.length === 64 && /^[a-f0-9]+$/i.test(h)) return ["SHA-256 (possible)"];
        return ["Unknown hash type"];
      }
      case "chmod": {
        if (args.length < 2) return ["chmod: missing operand"];
        return [`chmod: applied ${args[0]} to ${args[1]} (simulated)`];
      }
      case "stat": {
        if (args.length === 0) return ["stat: missing operand"];
        const abs = normalizePath(cwd, args[0]);
        const entry = files[abs];
        if (entry == null) return [`stat: ${args[0]}: no such file or directory`];
        return [
          `  File: ${abs}`,
          "  Size: 1337\tBlocks: 8       Regular file",
          "  Access: (0644/-rw-rw-rw-)  Uid: 1000/intern  Gid: 1000/intern",
        ];
      }
      default: {
        const custom = extraCommands[cmd];
        if (custom) {
          if (custom.stderr) return [custom.stderr];
          return (custom.output ?? "").split("\n");
        }
        const hint = (c.hints ?? [])[Math.floor(Math.random() * Math.max(1, (c.hints ?? []).length))];
        return [`${cmd}: command not found${hint ? ` — hint: ${hint}` : ""}`];
      }
    }
  }

  async function submit() {
    const line = input;
    if (!line.trim()) return;
    const promptLine = `${c.prompt ?? ""} ${line}`;
    const output = await run(line);
    setHistory((h) => [...h, promptLine, ...output]);
    setPast((p) => [...p, line]);
    setPastIdx(-1);
    setInput("");
    onAnswerChange?.({ lastCommand: line, flag: flagCache ?? "" });
  }

  // Server-verified tasks (T3): the salt is withheld from the client, so the
  // flag can't be rendered locally. The terminal stays the recon scratchpad; the
  // candidate submits the constructed injection here. On success the /verify
  // route returns the per-intern flag, which we prefill into the answer box.
  async function submitInjection() {
    if (!context.taskId || !injection.trim()) return;
    setVerifyMsg(null);
    setVerifyOk(false);
    setVerifying(true);
    try {
      const res = await fetch(
        `/api/stage/${context.stage}/tasks/${context.taskId}/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: injection }),
        }
      );
      const j = await res.json().catch(() => ({}));
      if (j.ok && typeof j.flag === "string") {
        onAnswerChange?.({ flag: j.flag, verified: true });
        setVerifyOk(true);
        setVerifyMsg("Verified — the flag has been placed in the answer box below.");
      } else {
        setVerifyMsg(j.message ?? j.error ?? "Verification failed.");
      }
    } catch {
      setVerifyMsg("Could not reach the verification service.");
    } finally {
      setVerifying(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void submit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (past.length === 0) return;
      const nextIdx = pastIdx === -1 ? past.length - 1 : Math.max(0, pastIdx - 1);
      setPastIdx(nextIdx);
      setInput(past[nextIdx] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (pastIdx === -1) return;
      const nextIdx = pastIdx + 1;
      if (nextIdx >= past.length) {
        setPastIdx(-1);
        setInput("");
      } else {
        setPastIdx(nextIdx);
        setInput(past[nextIdx] ?? "");
      }
    }
  }

  return (
    <div className="space-y-3">
    <div
      className="rounded-2xl border border-white/10 bg-black text-emerald-300 font-mono text-sm shadow-2xl overflow-hidden"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center gap-2 px-4 py-2 bg-neutral-950 border-b border-white/10 text-white/70 text-xs">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
        <span className="ml-4">sankofa-shell · {context.internCode}</span>
      </div>
      <div
        ref={scrollerRef}
        className="p-4 h-[300px] sm:h-[420px] overflow-y-auto leading-6 overscroll-contain"
      >
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">{line}</div>
        ))}
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">{c.prompt ?? "$"}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            enterKeyHint="send"
            className="flex-1 bg-transparent outline-none text-emerald-100 caret-emerald-400"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
          />
        </div>
        <div ref={endRef} />
      </div>
    </div>
    {c.verify?.kind && (
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
        <div className="text-xs text-white/50">
          Submit your injection to the server — it is checked server-side; only a
          valid extraction releases the flag.
        </div>
        <div className="flex gap-2">
          <input
            value={injection}
            onChange={(e) => setInjection(e.target.value)}
            placeholder="' UNION SELECT …"
            className="flex-1 bg-black/60 rounded-lg p-2.5 border border-white/10 outline-none font-mono text-sm text-emerald-100"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
          />
          <button
            onClick={() => void submitInjection()}
            disabled={verifying || !injection.trim()}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-sm font-semibold disabled:opacity-50"
          >
            {verifying ? "Verifying…" : "Verify"}
          </button>
        </div>
        {verifyMsg && (
          <div
            className={`text-sm font-mono whitespace-pre-wrap break-all ${
              verifyOk ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {verifyMsg}
          </div>
        )}
      </div>
    )}
    </div>
  );
}
