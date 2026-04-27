import { NextRequest } from "next/server";
import { sendPublicAcceptanceEmail } from "@/lib/email";

// Auth-gated end-to-end test of the welcome-email path. Calls the real
// helper with mock data + the real PDF generator. Returns the actual error
// text on failure instead of swallowing it like the approval flow used to.
//
// Use:
//   curl -s "https://ubuntubridgeinitiatives.org/api/debug/welcome-test?to=YOUR_EMAIL" \
//     -H "Authorization: Bearer $CRON_SECRET" | jq
//
// Stages reported in the response:
//   "env"           — SMTP env not configured
//   "pdf"           — PDF generation failed
//   "send"          — sendPublicAcceptanceEmail threw
//   "ok"            — full path succeeded; check the inbox + spam folder
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
  if (!to) {
    return Response.json({ error: "Missing ?to= recipient" }, { status: 400 });
  }

  const env = {
    SMTP_HOST: process.env.SMTP_HOST ?? null,
    SMTP_PORT: process.env.SMTP_PORT ?? null,
    SMTP_USER: process.env.SMTP_USER ?? null,
    SMTP_PASS_set: Boolean(process.env.SMTP_PASS),
    PUBLIC_APP_URL: process.env.PUBLIC_APP_URL ?? null,
  };
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS_set) {
    return Response.json({ ok: false, stage: "env", env }, { status: 500 });
  }

  // Build a real PDF the same way the approval flow does.
  let pdfBuffer: Buffer | undefined;
  let pdfError: string | null = null;
  try {
    const { generateAcceptancePDF } = await import("@/lib/generate-letter");
    pdfBuffer = await generateAcceptancePDF("Diagnostic Test", "SOC Analysis");
  } catch (err) {
    pdfError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  }

  // Now send the actual welcome email with the same helper the approval flow
  // calls. If this works but the approval flow doesn't, the bug is in the
  // approval route. If this fails, we have the literal error string.
  try {
    await sendPublicAcceptanceEmail(
      to,
      "Diagnostic Test",
      "SOC Analysis",
      "UBI-DEBUG-0000",
      "diag-temp-pass-123!",
      pdfBuffer
    );
    return Response.json({
      ok: true,
      stage: "ok",
      pdfBytes: pdfBuffer ? pdfBuffer.length : 0,
      pdfError,
      env,
      note: "Email sent. Check inbox and spam folder.",
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        stage: "send",
        sendError: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
        pdfBytes: pdfBuffer ? pdfBuffer.length : 0,
        pdfError,
        env,
      },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
