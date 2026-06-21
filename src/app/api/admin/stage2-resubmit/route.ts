import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { guardEmailSend } from "@/lib/email-send-guard";
import { logger } from "@/lib/logger";
import { sendRawHtmlEmail } from "@/lib/email";
import { renderResubmitEmail, type ResubmitTemplate } from "@/lib/stage2-resubmit-email";

// Send the Stage 2 "we could not open your capstone, please re-share" emails to
// the cannot-assess interns. Same lock as every applicant send: the authorised
// account + a fresh 2FA code. Recipients are posted from the admin page (not
// stored in the repo), each with a template and a one-line "what we found".
//
// POST body: { totpCode, recipients: [{ name, email, template, specifics }] }

const TEMPLATES: ResubmitTemplate[] = ["permission", "reorg", "missing"];

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json().catch(() => ({}));
    const blocked = await guardEmailSend(session, body?.totpCode);
    if (blocked) return blocked;

    const raw: unknown[] = Array.isArray(body?.recipients) ? body.recipients : [];
    const recipients = raw
      .map((r: unknown): Record<string, unknown> => (typeof r === "object" && r ? (r as Record<string, unknown>) : {}))
      .map((r: Record<string, unknown>) => ({
        name: typeof r.name === "string" ? r.name.trim() : "",
        email: typeof r.email === "string" ? r.email.trim().toLowerCase() : "",
        template: (typeof r.template === "string" ? r.template : "") as ResubmitTemplate,
        specifics: typeof r.specifics === "string" ? r.specifics.trim() : "",
      }))
      .filter((r: { email: string; specifics: string; template: ResubmitTemplate }) => r.email && r.specifics && TEMPLATES.includes(r.template));

    if (recipients.length === 0) {
      return Response.json({ error: "No valid recipients. Each needs email, template, and specifics." }, { status: 400 });
    }

    const sent: string[] = [];
    const failed: { email: string; error: string }[] = [];
    for (const r of recipients) {
      try {
        const { subject, html } = renderResubmitEmail({ name: r.name, template: r.template, specifics: r.specifics });
        await sendRawHtmlEmail(r.email, subject, html);
        sent.push(r.email);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error("stage2_resubmit_send_failed", err, { email: r.email });
        failed.push({ email: r.email, error: msg });
      }
    }

    logger.info("stage2_resubmit_sent", { sent: sent.length, failed: failed.length });
    return Response.json({ sent, failed, total: recipients.length });
  } catch (error) {
    logger.error("stage2_resubmit_dispatch_failed", error);
    return Response.json({ error: "Failed to send resubmission emails." }, { status: 500 });
  }
}
