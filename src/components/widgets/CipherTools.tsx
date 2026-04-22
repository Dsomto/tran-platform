"use client";

import { useEffect, useState } from "react";
import type { WidgetProps } from "./types";
import { resolveTemplate } from "./template";

type Tab =
  | "caesar"
  | "vigenere"
  | "base64"
  | "hex"
  | "binary"
  | "aes"
  | "hmac"
  | "jwt"
  | "hashid";

const TABS: { key: Tab; label: string }[] = [
  { key: "caesar", label: "Caesar" },
  { key: "vigenere", label: "Vigenère" },
  { key: "base64", label: "Base64" },
  { key: "hex", label: "Hex" },
  { key: "binary", label: "Binary" },
  { key: "aes", label: "AES-GCM" },
  { key: "hmac", label: "HMAC" },
  { key: "jwt", label: "JWT" },
  { key: "hashid", label: "Hash ID" },
];

function caesarShift(s: string, shift: number): string {
  const n = ((shift % 26) + 26) % 26;
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c >= "a" ? 97 : 65;
    return String.fromCharCode(((c.charCodeAt(0) - base + n) % 26) + base);
  });
}

function vigenere(s: string, key: string, decrypt = false): string {
  if (!key) return s;
  const k = key.toLowerCase().replace(/[^a-z]/g, "");
  if (!k) return s;
  let ki = 0;
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c >= "a" ? 97 : 65;
    const shift = k.charCodeAt(ki % k.length) - 97;
    ki++;
    const v = c.charCodeAt(0) - base;
    const out = decrypt ? (v - shift + 26) % 26 : (v + shift) % 26;
    return String.fromCharCode(out + base);
  });
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/i, "").replace(/\s+/g, "");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function toArrayBuffer(u: Uint8Array): ArrayBuffer {
  return u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
}

export default function CipherTools({ config, context, onAnswerChange }: WidgetProps) {
  const presets = (config as Record<string, unknown>) ?? {};
  const initialTab = (presets.initialTab as Tab) ?? "caesar";
  const [tab, setTab] = useState<Tab>(initialTab);

  const [caesarIn, setCaesarIn] = useState((presets.caesarInput as string) ?? "");
  const [caesarShiftN, setCaesarShift] = useState(
    typeof presets.caesarShift === "number" ? (presets.caesarShift as number) : 3
  );
  const [vigIn, setVigIn] = useState((presets.vigenereInput as string) ?? "");
  const [vigKey, setVigKey] = useState((presets.vigenereKey as string) ?? "");
  const [vigMode, setVigMode] = useState<"encrypt" | "decrypt">("decrypt");
  const [b64In, setB64In] = useState((presets.base64Input as string) ?? "");
  const [hexIn, setHexIn] = useState((presets.hexInput as string) ?? "");
  const [binIn, setBinIn] = useState((presets.binaryInput as string) ?? "");
  const [aesKey, setAesKey] = useState((presets.aesKey as string) ?? "");
  const [aesIv, setAesIv] = useState((presets.aesIv as string) ?? "");
  const [aesCipher, setAesCipher] = useState((presets.aesCiphertext as string) ?? "");
  const [aesOut, setAesOut] = useState("");
  const [hmacMsg, setHmacMsg] = useState((presets.hmacMessage as string) ?? "");
  const [hmacKey, setHmacKey] = useState((presets.hmacKey as string) ?? "");
  const [hmacOut, setHmacOut] = useState("");
  const [jwtIn, setJwtIn] = useState((presets.jwtInput as string) ?? "");
  const [jwtOut, setJwtOut] = useState("");
  const [hashIn, setHashIn] = useState((presets.hashInput as string) ?? "");

  useEffect(() => {
    let cancelled = false;

    const resolveString = async (key: string): Promise<string | undefined> => {
      const v = presets[key];
      if (typeof v !== "string") return undefined;
      return resolveTemplate(v, context);
    };

    (async () => {
      const caesar = await resolveString("caesarInput");
      if (!cancelled && caesar !== undefined) setCaesarIn(caesar);
      const vig = await resolveString("vigenereInput");
      if (!cancelled && vig !== undefined) setVigIn(vig);
      const vk = await resolveString("vigenereKey");
      if (!cancelled && vk !== undefined) setVigKey(vk);
      const hex = await resolveString("hexInput");
      if (!cancelled && hex !== undefined) setHexIn(hex);
      const bin = await resolveString("binaryInput");
      if (!cancelled && bin !== undefined) setBinIn(bin);
      const ak = await resolveString("aesKey");
      if (!cancelled && ak !== undefined) setAesKey(ak);
      const aiv = await resolveString("aesIv");
      if (!cancelled && aiv !== undefined) setAesIv(aiv);
      const ac = await resolveString("aesCiphertext");
      if (!cancelled && ac !== undefined) setAesCipher(ac);
      const hmk = await resolveString("hmacKey");
      if (!cancelled && hmk !== undefined) setHmacKey(hmk);
      const hmm = await resolveString("hmacMessage");
      if (!cancelled && hmm !== undefined) setHmacMsg(hmm);
      const jw = await resolveString("jwtInput");
      if (!cancelled && jw !== undefined) setJwtIn(jw);
      const hi = await resolveString("hashInput");
      if (!cancelled && hi !== undefined) setHashIn(hi);

      const b64Template = presets.base64Plaintext;
      const b64Direct = presets.base64Input;
      if (typeof b64Template === "string") {
        const plain = await resolveTemplate(b64Template, context);
        try {
          const encoded = btoa(unescape(encodeURIComponent(plain)));
          if (!cancelled) setB64In(encoded);
        } catch {
          if (!cancelled) setB64In(plain);
        }
      } else if (typeof b64Direct === "string") {
        const resolved = await resolveTemplate(b64Direct, context);
        if (!cancelled) setB64In(resolved);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [presets, context]);

  function caesarResult() {
    const out = caesarShift(caesarIn, -caesarShiftN);
    return out;
  }

  function vigResult() {
    return vigenere(vigIn, vigKey, vigMode === "decrypt");
  }

  async function runHmac() {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(hmacKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(hmacMsg));
    setHmacOut(toHex(new Uint8Array(sig)));
  }

  function decodeJwt() {
    try {
      const parts = jwtIn.trim().split(".");
      if (parts.length < 2) {
        setJwtOut("Invalid JWT");
        return;
      }
      const pad = (s: string) => s + "===".slice((s.length + 3) % 4);
      const header = JSON.parse(atob(pad(parts[0].replace(/-/g, "+").replace(/_/g, "/"))));
      const payload = JSON.parse(atob(pad(parts[1].replace(/-/g, "+").replace(/_/g, "/"))));
      setJwtOut(`HEADER:\n${JSON.stringify(header, null, 2)}\n\nPAYLOAD:\n${JSON.stringify(payload, null, 2)}`);
    } catch {
      setJwtOut("Failed to decode JWT");
    }
  }

  async function runAesGcmDecrypt() {
    try {
      const keyBuf = toArrayBuffer(fromHex(aesKey));
      const ivBuf = toArrayBuffer(fromHex(aesIv));
      const cipherBuf = toArrayBuffer(fromHex(aesCipher));
      const key = await crypto.subtle.importKey("raw", keyBuf, { name: "AES-GCM" }, false, ["decrypt"]);
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBuf }, key, cipherBuf);
      setAesOut(new TextDecoder().decode(plain));
    } catch {
      setAesOut("Decryption failed — check key / iv / ciphertext");
    }
  }

  function identifyHash(h: string): string {
    const s = h.trim();
    if (!s) return "";
    if (/^\$2[aby]\$/.test(s)) return "bcrypt";
    if (s.length === 32 && /^[a-f0-9]+$/i.test(s)) return "MD5 (possible)";
    if (s.length === 40 && /^[a-f0-9]+$/i.test(s)) return "SHA-1 (possible)";
    if (s.length === 64 && /^[a-f0-9]+$/i.test(s)) return "SHA-256 (possible)";
    if (s.length === 128 && /^[a-f0-9]+$/i.test(s)) return "SHA-512 (possible)";
    if (/^\$argon2/i.test(s)) return "Argon2";
    return "Unknown";
  }

  function notifyAnswer(value: string) {
    onAnswerChange?.({ derived: value });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-950 text-white overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 bg-black/40 border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-xs rounded-lg transition ${
              tab === t.key
                ? "bg-white/10 text-white"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-5 space-y-4 text-sm">
        {tab === "caesar" && (
          <div className="space-y-3">
            <textarea
              value={caesarIn}
              onChange={(e) => setCaesarIn(e.target.value)}
              placeholder="Ciphertext…"
              className="w-full h-24 bg-black/60 rounded-lg p-3 border border-white/10 outline-none focus:border-white/30 font-mono"
            />
            <div className="flex items-center gap-3">
              <label className="text-white/60 text-xs">Shift</label>
              <input
                type="range"
                min={0}
                max={25}
                value={caesarShiftN}
                onChange={(e) => setCaesarShift(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="font-mono w-8 text-right">{caesarShiftN}</span>
            </div>
            <pre
              className="bg-black/40 rounded-lg p-3 border border-white/10 overflow-x-auto font-mono text-emerald-200"
              onDoubleClick={() => notifyAnswer(caesarResult())}
            >
              {caesarResult() || " "}
            </pre>
          </div>
        )}
        {tab === "vigenere" && (
          <div className="space-y-3">
            <input
              value={vigKey}
              onChange={(e) => setVigKey(e.target.value)}
              placeholder="Key"
              className="w-full bg-black/60 rounded-lg p-3 border border-white/10 outline-none focus:border-white/30 font-mono"
            />
            <textarea
              value={vigIn}
              onChange={(e) => setVigIn(e.target.value)}
              placeholder="Ciphertext…"
              className="w-full h-24 bg-black/60 rounded-lg p-3 border border-white/10 outline-none focus:border-white/30 font-mono"
            />
            <div className="flex gap-2">
              {(["decrypt", "encrypt"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setVigMode(m)}
                  className={`px-3 py-1.5 text-xs rounded-lg ${
                    vigMode === m ? "bg-white/10" : "bg-black/40 text-white/60"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <pre
              className="bg-black/40 rounded-lg p-3 border border-white/10 overflow-x-auto font-mono text-emerald-200"
              onDoubleClick={() => notifyAnswer(vigResult())}
            >
              {vigResult() || " "}
            </pre>
          </div>
        )}
        {tab === "base64" && (
          <div className="space-y-3">
            <textarea
              value={b64In}
              onChange={(e) => setB64In(e.target.value)}
              placeholder="Text or base64…"
              className="w-full h-24 bg-black/60 rounded-lg p-3 border border-white/10 outline-none focus:border-white/30 font-mono"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-white/50 mb-1">Encoded</div>
                <pre className="bg-black/40 rounded-lg p-3 border border-white/10 overflow-x-auto font-mono text-cyan-200">
                  {(() => {
                    try {
                      return btoa(b64In);
                    } catch {
                      return "";
                    }
                  })()}
                </pre>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">Decoded</div>
                <pre className="bg-black/40 rounded-lg p-3 border border-white/10 overflow-x-auto font-mono text-amber-200">
                  {(() => {
                    try {
                      return atob(b64In.trim());
                    } catch {
                      return "";
                    }
                  })()}
                </pre>
              </div>
            </div>
          </div>
        )}
        {tab === "hex" && (
          <div className="space-y-3">
            <textarea
              value={hexIn}
              onChange={(e) => setHexIn(e.target.value)}
              placeholder="Text or hex…"
              className="w-full h-24 bg-black/60 rounded-lg p-3 border border-white/10 outline-none focus:border-white/30 font-mono"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-white/50 mb-1">Hex</div>
                <pre className="bg-black/40 rounded-lg p-3 border border-white/10 overflow-x-auto font-mono text-cyan-200 break-all">
                  {toHex(new TextEncoder().encode(hexIn))}
                </pre>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">Text</div>
                <pre className="bg-black/40 rounded-lg p-3 border border-white/10 overflow-x-auto font-mono text-amber-200 break-all">
                  {(() => {
                    try {
                      if (!/^[0-9a-fA-F\s]+$/.test(hexIn)) return "";
                      return new TextDecoder().decode(fromHex(hexIn));
                    } catch {
                      return "";
                    }
                  })()}
                </pre>
              </div>
            </div>
          </div>
        )}
        {tab === "binary" && (
          <div className="space-y-3">
            <textarea
              value={binIn}
              onChange={(e) => setBinIn(e.target.value)}
              placeholder="Text or binary (8-bit, space-separated)…"
              className="w-full h-24 bg-black/60 rounded-lg p-3 border border-white/10 outline-none focus:border-white/30 font-mono"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-white/50 mb-1">Binary</div>
                <pre className="bg-black/40 rounded-lg p-3 border border-white/10 overflow-x-auto font-mono text-cyan-200 break-all">
                  {Array.from(new TextEncoder().encode(binIn))
                    .map((b) => b.toString(2).padStart(8, "0"))
                    .join(" ")}
                </pre>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">Text</div>
                <pre className="bg-black/40 rounded-lg p-3 border border-white/10 overflow-x-auto font-mono text-amber-200 break-all">
                  {(() => {
                    const parts = binIn.trim().split(/\s+/);
                    if (!parts.every((p) => /^[01]{8}$/.test(p))) return "";
                    return String.fromCharCode(...parts.map((b) => parseInt(b, 2)));
                  })()}
                </pre>
              </div>
            </div>
          </div>
        )}
        {tab === "aes" && (
          <div className="space-y-3">
            <input
              value={aesKey}
              onChange={(e) => setAesKey(e.target.value)}
              placeholder="Key (hex)"
              className="w-full bg-black/60 rounded-lg p-3 border border-white/10 outline-none focus:border-white/30 font-mono"
            />
            <input
              value={aesIv}
              onChange={(e) => setAesIv(e.target.value)}
              placeholder="IV (hex, 12 bytes)"
              className="w-full bg-black/60 rounded-lg p-3 border border-white/10 outline-none focus:border-white/30 font-mono"
            />
            <textarea
              value={aesCipher}
              onChange={(e) => setAesCipher(e.target.value)}
              placeholder="Ciphertext (hex, ciphertext||tag)"
              className="w-full h-24 bg-black/60 rounded-lg p-3 border border-white/10 outline-none focus:border-white/30 font-mono"
            />
            <button
              onClick={runAesGcmDecrypt}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
            >
              Decrypt
            </button>
            <pre
              className="bg-black/40 rounded-lg p-3 border border-white/10 overflow-x-auto font-mono text-emerald-200"
              onDoubleClick={() => notifyAnswer(aesOut)}
            >
              {aesOut || " "}
            </pre>
          </div>
        )}
        {tab === "hmac" && (
          <div className="space-y-3">
            <input
              value={hmacKey}
              onChange={(e) => setHmacKey(e.target.value)}
              placeholder="Secret key"
              className="w-full bg-black/60 rounded-lg p-3 border border-white/10 outline-none focus:border-white/30 font-mono"
            />
            <textarea
              value={hmacMsg}
              onChange={(e) => setHmacMsg(e.target.value)}
              placeholder="Message"
              className="w-full h-20 bg-black/60 rounded-lg p-3 border border-white/10 outline-none focus:border-white/30 font-mono"
            />
            <button onClick={runHmac} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">
              Compute HMAC-SHA256
            </button>
            <pre
              className="bg-black/40 rounded-lg p-3 border border-white/10 overflow-x-auto font-mono text-emerald-200 break-all"
              onDoubleClick={() => notifyAnswer(hmacOut)}
            >
              {hmacOut || " "}
            </pre>
          </div>
        )}
        {tab === "jwt" && (
          <div className="space-y-3">
            <textarea
              value={jwtIn}
              onChange={(e) => setJwtIn(e.target.value)}
              placeholder="Paste JWT…"
              className="w-full h-20 bg-black/60 rounded-lg p-3 border border-white/10 outline-none focus:border-white/30 font-mono break-all"
            />
            <button
              onClick={decodeJwt}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
            >
              Decode
            </button>
            <pre className="bg-black/40 rounded-lg p-3 border border-white/10 overflow-x-auto font-mono text-cyan-200 whitespace-pre">
              {jwtOut || " "}
            </pre>
          </div>
        )}
        {tab === "hashid" && (
          <div className="space-y-3">
            <input
              value={hashIn}
              onChange={(e) => setHashIn(e.target.value)}
              placeholder="Paste hash…"
              className="w-full bg-black/60 rounded-lg p-3 border border-white/10 outline-none focus:border-white/30 font-mono"
            />
            <pre
              className="bg-black/40 rounded-lg p-3 border border-white/10 overflow-x-auto font-mono text-emerald-200"
              onDoubleClick={() => notifyAnswer(identifyHash(hashIn))}
            >
              {identifyHash(hashIn) || " "}
            </pre>
          </div>
        )}
      </div>
      <div className="px-5 py-2 text-[11px] text-white/40 border-t border-white/10 bg-black/40">
        tip: double-click any result to promote it to your answer draft
      </div>
    </div>
  );
}
