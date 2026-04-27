import { NextRequest } from "next/server";
import nodemailer from "nodemailer";

// Auth-gated SMTP diagnostic. Tests the live SMTP env values by:
//   1. Building a fresh transporter (NOT the cached one in src/lib/email.ts —
//      that one was instantiated at module load and may hold stale env).
//   2. Calling transporter.verify() — handshake + auth, no message sent.
//   3. If ?to=foo@bar.com is provided, sends a one-line test message.
//
// Auth via Bearer CRON_SECRET, same as email-drain. Hit this when an applicant
// reports "I never got the email" so the actual nodemailer error surfaces in
// the response instead of disappearing into Vercel logs.
async function handle(request: NextRequest): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const auth = request.headers.get("authorization") || "";
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const to = url.searchParams.get("to");

  const env = {
    SMTP_HOST: process.env.SMTP_HOST ?? null,
    SMTP_PORT: process.env.SMTP_PORT ?? null,
    SMTP_USER: process.env.SMTP_USER ?? null,
    SMTP_PASS_set: Boolean(process.env.SMTP_PASS),
  };

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS_set) {
    return Response.json(
      {
        ok: false,
        stage: "env",
        error:
          "SMTP env not fully configured. Check the Production scope in Vercel and redeploy.",
        env,
      },
      { status: 500 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST!,
    port: parseInt(env.SMTP_PORT || "587"),
    secure: false,
    auth: { user: env.SMTP_USER!, pass: process.env.SMTP_PASS! },
  });

  try {
    await transporter.verify();
  } catch (err) {
    return Response.json(
      {
        ok: false,
        stage: "verify",
        error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
        env,
      },
      { status: 500 }
    );
  }

  if (!to) {
    return Response.json({ ok: true, stage: "verify", env });
  }

  try {
    const info = await transporter.sendMail({
      from: `"UBI Diagnostic" <${env.SMTP_USER}>`,
      to,
      subject: "UBI SMTP test",
      text: "If you see this, SMTP is working end to end.",
    });
    return Response.json({
      ok: true,
      stage: "send",
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      env,
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        stage: "send",
        error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
        env,
      },
      { status: 500 }
    );
  } finally {
    transporter.close();
  }
}

export const GET = handle;
export const POST = handle;
