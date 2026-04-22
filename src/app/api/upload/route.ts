import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { logger } from "@/lib/logger";

/**
 * Simple file-upload endpoint used by the DiagramUpload widget.
 *
 * Stores files under public/uploads/<uuid>-<safe-name>. Not appropriate for
 * large-scale production — swap for @vercel/blob when that's wired up.
 */

const MAX_BYTES = 25 * 1024 * 1024;
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(request: Request): Promise<Response> {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: `File too large (max ${MAX_BYTES / 1024 / 1024} MiB)` }, { status: 413 });
    }

    const rawName = "name" in file && typeof (file as File).name === "string" ? (file as File).name : "upload.bin";
    const safeName = rawName.replace(/[^A-Za-z0-9._-]/g, "_").slice(-80);
    const stored = `${crypto.randomUUID()}-${safeName}`;

    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(UPLOADS_DIR, stored), buf);

    const url = `/uploads/${stored}`;
    return Response.json({ url, filename: rawName, size: buf.length });
  } catch (err) {
    logger.error("upload_failed", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
