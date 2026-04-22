"use client";

import { useEffect, useRef, useState } from "react";
import type { WidgetProps } from "./types";
import { deriveSecretBrowser } from "./flag-browser";

/**
 * Canvas-based stego viewer.
 *
 * config shape:
 * {
 *   imageUrl?: string,        // either a direct image URL…
 *   stegoMessage?: string,    // …or a message we hide client-side in a generated image
 *   exif?: Record<string,string>,
 *   instructions?: string
 * }
 *
 * When `stegoMessage` is provided we render a 320×180 gradient with the
 * message encoded in the red-channel LSBs so the "Extract LSB" button can
 * pull it back out — same math the intern would run on a real LSB image.
 *
 * If the task has a flagSalt, the final exposed message appends the intern's
 * per-intern flag so submissions are non-copyable.
 */

type Config = {
  imageUrl?: string;
  stegoMessage?: string;
  exif?: Record<string, string>;
  instructions?: string;
  derivedSecretSalt?: string; // when set, append HMAC(salt, internId)[:N] to the message
  derivedSecretLen?: number;
};

function encodeIntoCanvas(canvas: HTMLCanvasElement, msg: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#0ea5e9");
  grad.addColorStop(1, "#6366f1");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < 12; i++) {
    ctx.fillRect(Math.random() * w, Math.random() * h, 60, 60);
  }
  // embed length-prefixed message in red-channel LSBs.
  const bytes = new TextEncoder().encode(msg);
  const img = ctx.getImageData(0, 0, w, h);
  const totalBits = 32 + bytes.length * 8;
  if (totalBits > img.data.length / 4) return;
  // length header
  for (let i = 0; i < 32; i++) {
    const bit = (bytes.length >> (31 - i)) & 1;
    const idx = i * 4; // red channel
    img.data[idx] = (img.data[idx] & 0xfe) | bit;
  }
  for (let b = 0; b < bytes.length; b++) {
    for (let bit = 0; bit < 8; bit++) {
      const bitVal = (bytes[b] >> (7 - bit)) & 1;
      const pxIdx = 32 + b * 8 + bit;
      const idx = pxIdx * 4;
      img.data[idx] = (img.data[idx] & 0xfe) | bitVal;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function extractFromCanvas(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const w = canvas.width;
  const h = canvas.height;
  const img = ctx.getImageData(0, 0, w, h);
  let len = 0;
  for (let i = 0; i < 32; i++) len = (len << 1) | (img.data[i * 4] & 1);
  if (len <= 0 || len > (img.data.length / 4 - 32) / 8) return "";
  const bytes = new Uint8Array(len);
  for (let b = 0; b < len; b++) {
    let val = 0;
    for (let bit = 0; bit < 8; bit++) {
      const pxIdx = 32 + b * 8 + bit;
      val = (val << 1) | (img.data[pxIdx * 4] & 1);
    }
    bytes[b] = val;
  }
  return new TextDecoder().decode(bytes);
}

export default function StegoViewer({ config, context, onAnswerChange }: WidgetProps) {
  const c = (config as Config) ?? {};
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [extracted, setExtracted] = useState("");
  const [exifOpen, setExifOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (c.imageUrl) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = c.imageUrl;
        img.onload = () => {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0);
        };
        return;
      }
      canvas.width = 360;
      canvas.height = 200;
      let message = c.stegoMessage ?? "";
      if (c.derivedSecretSalt) {
        const secret = await deriveSecretBrowser(
          c.derivedSecretSalt,
          context.internId,
          c.derivedSecretLen ?? 12
        );
        message = `${message} ${secret}`.trim();
      }
      if (cancelled) return;
      encodeIntoCanvas(canvas, message || "no message configured");
    })();
    return () => {
      cancelled = true;
    };
  }, [c.imageUrl, c.stegoMessage, c.derivedSecretSalt, c.derivedSecretLen, context.internId]);

  function extract() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const msg = extractFromCanvas(canvas);
    setExtracted(msg);
    onAnswerChange?.({ extracted: msg });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-950 text-white overflow-hidden">
      <div className="p-4 flex items-center justify-between bg-black/40 border-b border-white/10 text-xs text-white/60">
        <span>Stego analyser · {context.internCode}</span>
        <div className="flex gap-2">
          <button
            onClick={extract}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
          >
            Extract LSB
          </button>
          <button
            onClick={() => setExifOpen((v) => !v)}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15"
          >
            EXIF
          </button>
        </div>
      </div>
      <div className="p-5 grid gap-4 md:grid-cols-2 items-start">
        <div className="bg-black/50 rounded-xl p-3 border border-white/10">
          <canvas ref={canvasRef} className="block mx-auto rounded-lg max-w-full h-auto" />
          {c.instructions && (
            <p className="mt-3 text-xs text-white/50 leading-relaxed">{c.instructions}</p>
          )}
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <div className="text-xs text-white/50 mb-1">Red-channel LSB output</div>
            <pre className="bg-black/40 rounded-lg p-3 border border-white/10 overflow-x-auto font-mono text-emerald-200 min-h-[80px] break-all">
              {extracted || "(click Extract LSB)"}
            </pre>
          </div>
          {exifOpen && c.exif && (
            <div>
              <div className="text-xs text-white/50 mb-1">EXIF</div>
              <pre className="bg-black/40 rounded-lg p-3 border border-white/10 overflow-x-auto font-mono text-cyan-200 text-xs">
                {Object.entries(c.exif).map(([k, v]) => `${k}: ${v}`).join("\n")}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
