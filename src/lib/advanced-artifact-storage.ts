import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

export type AdvancedArtifactObject = {
  body: BodyInit;
  size: number | null;
};

function safeKey(key: string): string[] | null {
  if (!key || key.includes("\\") || key.includes("\0")) return null;
  const parts = key.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) return null;
  if (parts.some((part) => !/^[a-zA-Z0-9._-]+$/.test(part))) return null;
  return parts;
}

export async function openAdvancedArtifact(key: string): Promise<AdvancedArtifactObject | null> {
  const parts = safeKey(key);
  if (!parts) return null;

  const roots = [
    path.resolve(process.cwd(), "stage5-artifacts"),
    path.resolve(process.cwd(), "advanced-stage-artifacts"),
    ...(process.env.ADVANCED_ARTIFACT_ROOT ? [path.resolve(process.env.ADVANCED_ARTIFACT_ROOT)] : []),
  ];
  for (const root of roots) {
    const absolutePath = path.resolve(root, ...parts);
    if (!absolutePath.startsWith(`${root}${path.sep}`)) continue;
    try {
      const details = await stat(absolutePath);
      if (!details.isFile()) continue;
      const stream = createReadStream(absolutePath);
      return {
        body: Readable.toWeb(stream) as ReadableStream<Uint8Array>,
        size: details.size,
      };
    } catch {
      // Try the next local source before the optional remote fallback.
    }
  }

  const origin = process.env.ADVANCED_ARTIFACT_ORIGIN?.replace(/\/$/, "");
  const originToken = process.env.ADVANCED_ARTIFACT_ORIGIN_TOKEN;
  if (origin && originToken) {
    const url = `${origin}/${parts.map(encodeURIComponent).join("/")}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${originToken}` },
      cache: "no-store",
    });
    if (!response.ok || !response.body) return null;
    const contentLength = response.headers.get("content-length");
    return {
      body: response.body,
      size: contentLength ? Number.parseInt(contentLength, 10) : null,
    };
  }

  return null;
}
