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
  files?: Record<string, FileEntry>;
  commands?: Record<string, { output?: string; stderr?: string }>;
  hints?: string[];
};

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
  const [cwd, setCwd] = useState("/home/intern");
  const [past, setPast] = useState<string[]>([]);
  const [pastIdx, setPastIdx] = useState<number>(-1);
  const [flagCache, setFlagCache] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
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
    endRef.current?.scrollIntoView({ behavior: "smooth" });
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
        if (names.length === 0) return [`ls: ${target}: no such file or directory`];
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
      <div className="p-4 h-[420px] overflow-y-auto leading-6">
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
            className="flex-1 bg-transparent outline-none text-emerald-100 caret-emerald-400"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div ref={endRef} />
      </div>
    </div>
  );
}
