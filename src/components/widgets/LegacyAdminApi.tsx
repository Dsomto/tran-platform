"use client";

import { useState } from "react";
import type { WidgetProps } from "./types";
import { computeFlagBrowser } from "./flag-browser";

/**
 * Mock HTTP endpoint that validates an HS256 JWT the intern is supposed to
 * have forged offline (from the cracked secret in 04-weak-jwt-hmac.txt) and,
 * on success, returns a customer record containing the per-intern flag.
 *
 * Behaviour:
 *   - Intern crafts a JWT offline with the cracked secret and the right
 *     claims (role=admin, sub=their UBI code, exp not yet elapsed).
 *   - They paste it into the Authorization header field.
 *   - The widget parses + verifies the JWT entirely client-side via
 *     SubtleCrypto. If valid, it renders a fake HTTP 200 response with a
 *     customer record JSON; the record's `flag` field is the same
 *     HMAC(salt, internId) flag pattern the other widgets use, so the
 *     intern reads it off the response and submits it on the task page.
 *
 * widgetConfig:
 *   {
 *     secret: string,         // the legacy admin's hard-coded HS256 secret
 *     issuer?: string,        // expected `iss` claim (default: "legacy-admin")
 *     requiredRole?: string,  // expected `role` claim (default: "admin")
 *   }
 *
 * No data ever leaves the browser. The "endpoint" is purely a UX surface.
 */

type Config = {
  secret?: string;
  issuer?: string;
  requiredRole?: string;
};

type DecodedJwt = {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signatureB64: string;
  signingInput: string;
};

function b64urlDecode(s: string): string {
  let pad = s.length % 4;
  if (pad === 2) s += "==";
  else if (pad === 3) s += "=";
  else if (pad !== 0 && pad !== 1) throw new Error("malformed b64url");
  return atob(s.replace(/-/g, "+").replace(/_/g, "/"));
}

function b64urlBytes(s: string): Uint8Array {
  const bin = b64urlDecode(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function parseJwt(raw: string): DecodedJwt {
  const trimmed = raw.replace(/^Bearer\s+/i, "").trim();
  const parts = trimmed.split(".");
  if (parts.length !== 3) throw new Error("Not a JWT (expected three dot-separated parts).");
  const header = JSON.parse(b64urlDecode(parts[0]));
  const payload = JSON.parse(b64urlDecode(parts[1]));
  return {
    header,
    payload,
    signatureB64: parts[2],
    signingInput: `${parts[0]}.${parts[1]}`,
  };
}

async function verifyHs256(signingInput: string, signatureB64: string, secret: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(signingInput));
  const expected = new Uint8Array(sig);
  const got = b64urlBytes(signatureB64);
  if (expected.length !== got.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ got[i];
  return diff === 0;
}

export default function LegacyAdminApi({ config, context, onAnswerChange }: WidgetProps) {
  const c = (config ?? {}) as Config;
  const secret = c.secret ?? "";
  const issuer = c.issuer ?? "legacy-admin";
  const requiredRole = c.requiredRole ?? "admin";

  const endpointUrl = `https://legacy-admin.sankofa.internal/v1/customers/${context.internCode}`;

  const [authHeader, setAuthHeader] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<
    | { kind: "ok"; status: 200; body: string; decoded: DecodedJwt }
    | { kind: "err"; status: number; reason: string; decoded?: DecodedJwt }
    | null
  >(null);

  async function send() {
    setSending(true);
    setResult(null);
    try {
      if (!authHeader.trim()) {
        setResult({ kind: "err", status: 400, reason: "Authorization header is empty." });
        return;
      }
      let decoded: DecodedJwt;
      try {
        decoded = parseJwt(authHeader);
      } catch (e) {
        setResult({ kind: "err", status: 400, reason: e instanceof Error ? e.message : "JWT parse failed." });
        return;
      }
      const alg = String(decoded.header.alg ?? "");
      if (alg !== "HS256") {
        setResult({
          kind: "err",
          status: 401,
          reason: `Unsupported alg "${alg}". This endpoint accepts HS256 only.`,
          decoded,
        });
        return;
      }
      if (!secret) {
        setResult({ kind: "err", status: 500, reason: "Widget misconfigured — no signing secret." });
        return;
      }
      const sigValid = await verifyHs256(decoded.signingInput, decoded.signatureB64, secret);
      if (!sigValid) {
        setResult({
          kind: "err",
          status: 401,
          reason: "Signature verification failed. Either the secret is wrong, or the header/payload was modified after signing.",
          decoded,
        });
        return;
      }
      const role = String(decoded.payload.role ?? "");
      if (role !== requiredRole) {
        setResult({
          kind: "err",
          status: 403,
          reason: `Token signed correctly but role="${role || "(missing)"}" — this endpoint requires role="${requiredRole}".`,
          decoded,
        });
        return;
      }
      const sub = String(decoded.payload.sub ?? "");
      if (sub !== context.internCode) {
        setResult({
          kind: "err",
          status: 403,
          reason: `Token sub="${sub || "(missing)"}" does not match the URL path. Use sub="${context.internCode}".`,
          decoded,
        });
        return;
      }
      const iss = String(decoded.payload.iss ?? "");
      if (iss && iss !== issuer) {
        setResult({
          kind: "err",
          status: 401,
          reason: `Token iss="${iss}" — this endpoint only trusts iss="${issuer}".`,
          decoded,
        });
        return;
      }
      const now = Math.floor(Date.now() / 1000);
      const exp = Number(decoded.payload.exp ?? 0);
      if (!exp || exp < now) {
        setResult({
          kind: "err",
          status: 401,
          reason: `Token exp=${exp || "(missing)"} is in the past or absent. Forge with exp > now (unix seconds).`,
          decoded,
        });
        return;
      }

      const flag = context.flagSalt
        ? await computeFlagBrowser(context.flagSalt, context.internId)
        : "TRAN{flag-misconfigured}";

      const body = JSON.stringify(
        {
          status: "ok",
          customer: {
            id: context.internCode,
            display_name: "Customer record (mock)",
            tier: "PLATINUM",
            account_status: "active",
            audit_flag: flag,
            note: "Forged-token access to legacy-admin succeeded. Copy `audit_flag` to the answer box on the task page.",
          },
          server_time: new Date().toISOString(),
        },
        null,
        2,
      );
      setResult({ kind: "ok", status: 200, body, decoded });
      onAnswerChange?.({ flag, lastRequest: { sub, role, exp } });
    } finally {
      setSending(false);
    }
  }

  const decodedPretty = (d: DecodedJwt) => ({
    header: JSON.stringify(d.header, null, 2),
    payload: JSON.stringify(d.payload, null, 2),
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-950 text-white/90 p-5 shadow-2xl space-y-4">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-300 mb-1.5">
          legacy-admin · v1
        </div>
        <div className="font-mono text-sm bg-black/60 border border-white/10 rounded-lg p-3 break-all">
          GET {endpointUrl}
        </div>
        <p className="text-xs text-white/55 mt-2 leading-relaxed">
          The legacy admin app at this endpoint accepts an HS256 JWT in the Authorization header
          and returns the customer record at the path. Forge a token with the right secret and
          the right claims; the body of a 200 response will include an{" "}
          <code className="font-mono text-emerald-200">audit_flag</code> you submit on the task page.
        </p>
      </div>

      <div>
        <label className="block text-[10.5px] font-mono uppercase tracking-wide text-white/60 mb-1.5">
          Authorization header
        </label>
        <textarea
          value={authHeader}
          onChange={(e) => setAuthHeader(e.target.value)}
          rows={3}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          placeholder="Bearer eyJhbGciOiJIUzI1NiIs..."
          className="w-full bg-black/60 border border-white/10 rounded-lg p-3 font-mono text-xs text-emerald-100 outline-none focus:border-emerald-500/40"
        />
      </div>

      <button
        onClick={send}
        disabled={sending}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send request"}
      </button>

      {result && (
        <div className="space-y-2">
          <div
            className={`font-mono text-xs rounded-lg border p-3 ${
              result.kind === "ok"
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                : "border-rose-400/40 bg-rose-500/10 text-rose-200"
            }`}
          >
            HTTP/1.1 {result.status} {result.kind === "ok" ? "OK" : "Error"}
            {result.kind === "err" && (
              <>
                <br />
                {result.reason}
              </>
            )}
          </div>
          {result.kind === "ok" && (
            <pre className="font-mono text-xs bg-black/60 border border-white/10 rounded-lg p-3 overflow-x-auto whitespace-pre">
              {result.body}
            </pre>
          )}
          {result.decoded && (
            <details className="text-xs text-white/65">
              <summary className="cursor-pointer hover:text-white/90">Decoded JWT</summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <div>
                  <div className="text-[10px] font-mono uppercase text-white/45 mb-1">header</div>
                  <pre className="font-mono text-xs bg-black/40 border border-white/10 rounded p-2 overflow-x-auto">
                    {decodedPretty(result.decoded).header}
                  </pre>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-white/45 mb-1">payload</div>
                  <pre className="font-mono text-xs bg-black/40 border border-white/10 rounded p-2 overflow-x-auto">
                    {decodedPretty(result.decoded).payload}
                  </pre>
                </div>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
