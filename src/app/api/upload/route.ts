import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

/**
 * File-upload endpoint used by DiagramUpload and similar widgets.
 *
 * Security posture:
 *   - Authenticated callers only. Unauthenticated = 404 (not 401)
 *     so scanners can't confirm the endpoint exists.
 *   - Rate-limited to 10/min per session.
 *   - Strict MIME allowlist. No SVG (inline script), HTML, or binary.
 *   - Extension derived from MIME, not the client-supplied filename.
 *     The client's filename never hits the filesystem.
 *   - 10 MiB ceiling.
 */

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

function ipFromRequest(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await getSession();
    if (!session) {
      return new Response(null, { status: 404 });
    }

    const rl = await rateLimit(`upload:${session.id}:${ipFromRequest(request)}`, {
      max: 10,
      windowMs: 60_000,
    });
    if (!rl.ok) return rateLimitResponse(rl);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size === 0) {
      return Response.json({ error: "File is empty" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json(
        { error: `File too large (max ${MAX_BYTES / 1024 / 1024} MiB)` },
        { status: 413 }
      );
    }

    const mime = file.type || "application/octet-stream";
    const extension = ALLOWED_MIME[mime];
    if (!extension) {
      return Response.json(
        { error: "File type not allowed. Upload PNG, JPG, WEBP, or PDF only." },
        { status: 415 }
      );
    }

    const rawName =
      "name" in file && typeof (file as File).name === "string"
        ? (file as File).name
        : `upload.${extension}`;

    const stored = `${crypto.randomUUID()}.${extension}`;
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(UPLOADS_DIR, stored), buf);

    const url = `/uploads/${stored}`;
    logger.info("upload_success", {
      userId: session.id,
      mime,
      size: buf.length,
      stored,
    });
    return Response.json({ url, filename: rawName, size: buf.length });
  } catch (err) {
    logger.error("upload_failed", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
