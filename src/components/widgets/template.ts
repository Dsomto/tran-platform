import { computeFlagBrowser, deriveSecretBrowser } from "./flag-browser";
import type { TaskContext } from "./types";

const FLAG_RE = /\{FLAG\}/g;
const SECRET_RE = /\{SECRET:([^:}]+)(?::(\d+))?\}/g;

export async function resolveTemplate(input: string, ctx: TaskContext): Promise<string> {
  if (typeof input !== "string") return input;
  if (!input.includes("{")) return input;

  let out = input;

  if (FLAG_RE.test(out)) {
    if (ctx.flagSalt && ctx.internId) {
      const flag = await computeFlagBrowser(ctx.flagSalt, ctx.internId);
      out = out.replace(FLAG_RE, flag);
    }
  }

  const matches: RegExpExecArray[] = [];
  const scanRe = new RegExp(SECRET_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = scanRe.exec(out)) !== null) matches.push(m);

  for (const match of matches) {
    if (!ctx.internId) continue;
    const salt = match[1];
    const len = match[2] ? parseInt(match[2], 10) : 16;
    const sec = await deriveSecretBrowser(salt, ctx.internId, len);
    out = out.split(match[0]).join(sec);
  }

  return out;
}

export async function resolveTemplates<T>(value: T, ctx: TaskContext): Promise<T> {
  if (value == null) return value;
  if (typeof value === "string") {
    return (await resolveTemplate(value, ctx)) as unknown as T;
  }
  if (Array.isArray(value)) {
    const arr = await Promise.all(value.map((v) => resolveTemplates(v, ctx)));
    return arr as unknown as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = await resolveTemplates(v, ctx);
    }
    return out as unknown as T;
  }
  return value;
}
