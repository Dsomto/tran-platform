import nodemailer from "nodemailer";
import { logger } from "./logger";
import { publicAppUrl } from "./public-url";
import { signLetter } from "./letter-sig";

// Build a fresh SMTP transporter on every send. We previously kept a pooled
// singleton at module level, but that pattern fails badly on Vercel:
//   - If the lambda cold-starts before env is fully populated, the singleton
//     captures undefined credentials and every subsequent send silently fails.
//   - Pooled connections also go stale across the lambda freeze/thaw cycle.
// The diagnostic endpoint at /api/debug/smtp-test creates a fresh transport
// per call and consistently delivers — so we mirror that pattern here. The
// extra ~200ms per send is negligible at our volume.
function newTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    // Throw so the caller's catch + logger surfaces the misconfiguration
    // instead of nodemailer hanging on a half-built connection.
    throw new Error(
      `SMTP env not configured (host=${host ? "set" : "missing"}, user=${user ? "set" : "missing"}, pass=${pass ? "set" : "missing"})`
    );
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass },
  });
}

// Tag every send with a single console.log line so the function logs always
// show what was attempted, even if the structured logger pipeline is buffered.
async function sendOne(
  label: string,
  options: nodemailer.SendMailOptions
): Promise<void> {
  const t = newTransporter();
  console.log(`[email:${label}] sending to=${options.to}`);
  try {
    const info = await t.sendMail(options);
    console.log(`[email:${label}] sent to=${options.to} response=${info.response}`);
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[email:${label}] failed to=${options.to} err=${msg}`);
    throw err;
  } finally {
    t.close();
  }
}

const FROM = `"Somto from Ubuntu Bridge Initiative" <noreply@ubuntubridgeinitiatives.org>`;

export async function sendApplicationConfirmation(
  to: string,
  fullName: string
): Promise<void> {
  const firstName = fullName.split(" ")[0];

  await sendOne("send", {
    from: `"Somto from Ubuntu Bridge Initiative" <noreply@ubuntubridgeinitiatives.org>`,
    to,
    subject: "We've Received Your Application — UBI",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #F8FAFC; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #2563EB, #0891B2); padding: 40px; border-radius: 16px; text-align: center; color: white;">
          <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700;">🛡️ UBI</h1>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">Ubuntu Bridge Initiative</p>
        </div>
        <div style="background: white; padding: 40px; border-radius: 16px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="color: #0F172A; margin: 0 0 16px;">Congratulations, ${firstName}! 🎉</h2>
          <p style="color: #64748B; line-height: 1.8; margin: 0 0 16px;">
            Your application to the <strong style="color: #2563EB;">UBI Cybersecurity Internship Programme</strong> has been received successfully.
          </p>
          <p style="color: #64748B; line-height: 1.8; margin: 0 0 16px;">
            We're currently reviewing all applications. If you pass the screening stage, we will send you an email with your next steps — so <strong>keep an eye on your inbox</strong>.
          </p>
          <div style="background: #F0F9FF; border-left: 4px solid #2563EB; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 24px 0;">
            <p style="color: #1E40AF; margin: 0; font-size: 14px; line-height: 1.6;">
              <strong>What happens next?</strong><br/>
              Our team reviews every application individually. If selected, you'll receive an onboarding email with instructions to get started at Stage 0.
            </p>
          </div>
          <p style="color: #64748B; line-height: 1.8; margin: 16px 0 0;">
            In the meantime, stay sharp and keep learning. We look forward to potentially having you on board.
          </p>
        </div>
        <p style="text-align: center; color: #94A3B8; font-size: 12px; margin-top: 24px;">
          &copy; 2026 UBI — Ubuntu Bridge Initiative. Building the next generation of cybersecurity professionals.
        </p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(
  to: string,
  firstName: string
): Promise<void> {
  await sendOne("send", {
    from: `"Somto from Ubuntu Bridge Initiative" <noreply@ubuntubridgeinitiatives.org>`,
    to,
    subject: "Welcome to UBI — Your Cybersecurity Journey Begins!",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #F8FAFC; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #2563EB, #0891B2); padding: 40px; border-radius: 16px; text-align: center; color: white;">
          <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700;">UBI</h1>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">Ubuntu Bridge Initiative</p>
        </div>
        <div style="background: white; padding: 40px; border-radius: 16px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="color: #0F172A; margin: 0 0 16px;">Congratulations, ${firstName}!</h2>
          <p style="color: #64748B; line-height: 1.6; margin: 0 0 16px;">
            Your application has been approved. You are now officially part of the <strong style="color: #2563EB;">UBI Cybersecurity Internship Programme</strong>.
          </p>
          <p style="color: #64748B; line-height: 1.6; margin: 0 0 24px;">
            You start at <strong>Stage 0</strong>. Log in to your dashboard to see your first assignments and meet your team.
          </p>
          <a href="${publicAppUrl()}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #2563EB, #0891B2); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Go to Dashboard
          </a>
        </div>
        <p style="text-align: center; color: #94A3B8; font-size: 12px; margin-top: 24px;">
          &copy; 2026 UBI — Ubuntu Bridge Initiative. Building the next generation of cybersecurity professionals.
        </p>
      </div>
    `,
  });
}

export async function sendRejectionEmail(
  to: string,
  firstName: string
): Promise<void> {
  await sendOne("send", {
    from: `"Somto from Ubuntu Bridge Initiative" <noreply@ubuntubridgeinitiatives.org>`,
    to,
    subject: "UBI Application Update",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #F8FAFC; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #2563EB, #0891B2); padding: 40px; border-radius: 16px; text-align: center; color: white;">
          <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700;">UBI</h1>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">Ubuntu Bridge Initiative</p>
        </div>
        <div style="background: white; padding: 40px; border-radius: 16px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="color: #0F172A; margin: 0 0 16px;">Hi ${firstName},</h2>
          <p style="color: #64748B; line-height: 1.6; margin: 0 0 16px;">
            Thank you for applying to UBI. After careful review, we are unable to offer you a spot in this cohort.
          </p>
          <p style="color: #64748B; line-height: 1.6; margin: 0 0 16px;">
            We encourage you to continue building your skills and apply again in a future cohort. Keep learning, keep hacking!
          </p>
        </div>
      </div>
    `,
  });
}

// ─── PUBLIC APPLICATION EMAILS ───────────────────────────

// Render the acceptance email body. Returns subject + html so the same content
// can be delivered via direct send OR by enqueueing in EmailQueueItem (for
// retry on transient SMTP failures). Kept as a separate function so route
// handlers can queue without forcing a synchronous send.
export function renderPublicAcceptanceEmail(opts: {
  fullName: string;
  trackInterest: string;
  internId?: string;
  tempPassword?: string;
}): { subject: string; html: string } {
  const { fullName, trackInterest, internId, tempPassword } = opts;
  const firstName = fullName.split(" ")[0];
  const sig = signLetter(fullName, trackInterest);
  const letterUrl = `${publicAppUrl()}/letter/acceptance?name=${encodeURIComponent(fullName)}&track=${encodeURIComponent(trackInterest)}&sig=${sig}`;
  const loginUrl = `${publicAppUrl()}/login`;

  return {
    subject: "Your UBI application has been accepted",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #F8FAFC; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #2563EB, #0891B2); padding: 32px; border-radius: 16px; text-align: center; color: white;">
          <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700;">UBI</h1>
          <p style="margin: 0; font-size: 13px; opacity: 0.9;">Ubuntu Bridge Initiative</p>
        </div>
        <div style="background: white; padding: 32px; border-radius: 16px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="color: #0F172A; margin: 0 0 16px;">Hi ${firstName},</h2>
          <p style="color: #334155; line-height: 1.7; margin: 0 0 16px;">
            Your application to the UBI Cybersecurity Internship Programme has been accepted. Welcome to Cohort 1 on the ${trackInterest} track.
          </p>
          ${internId && tempPassword ? `
          <p style="color: #334155; line-height: 1.7; margin: 0 0 16px;">
            You can log in at <a href="${loginUrl}" style="color: #2563EB;">${loginUrl}</a> using your intern ID <strong>${internId}</strong> and the temporary password <strong>${tempPassword}</strong>. You will be asked to change the password on first login. Please do not share it.
          </p>
          ` : ""}
          <p style="color: #334155; line-height: 1.7; margin: 0 0 16px;">
            The orientation date and the programme start date will be communicated separately. Please keep an eye on your inbox.
          </p>
          <p style="color: #334155; line-height: 1.7; margin: 0 0 16px;">
            You can read your acceptance letter here:
            <a href="${letterUrl}" style="color: #2563EB;">${letterUrl}</a>
          </p>
          ${process.env.SLACK_CHANNEL_URL ? `
          <p style="color: #334155; line-height: 1.7; margin: 0 0 16px;">
            Our cohort coordinates on Slack. Join here when you can: <a href="${process.env.SLACK_CHANNEL_URL}" style="color: #2563EB;">${process.env.SLACK_CHANNEL_URL}</a>
          </p>
          ` : ""}
          <p style="color: #334155; line-height: 1.7; margin: 24px 0 0;">
            Looking forward to working with you.<br/>
            — The UBI Team
          </p>
        </div>
        <p style="text-align: center; color: #94A3B8; font-size: 12px; margin-top: 24px;">
          Ubuntu Bridge Initiative
        </p>
      </div>
    `,
  };
}

// Direct synchronous send. Now mostly used by the diagnostic endpoint;
// production code paths should prefer the queue (renderPublicAcceptanceEmail
// + emailQueueItem.create) so transient SMTP failures retry automatically.
export async function sendPublicAcceptanceEmail(
  to: string,
  fullName: string,
  trackInterest: string,
  internId?: string,
  tempPassword?: string,
  // Kept for backward-compat with old call sites; the email no longer attaches.
  _pdfBuffer?: Buffer
): Promise<void> {
  const { subject, html } = renderPublicAcceptanceEmail({
    fullName,
    trackInterest,
    internId,
    tempPassword,
  });
  await sendOne("send", {
    from: `"Somto from Ubuntu Bridge Initiative" <noreply@ubuntubridgeinitiatives.org>`,
    to,
    subject,
    html,
  });
}

export async function sendPublicRejectionEmail(
  to: string,
  fullName: string
): Promise<void> {
  const firstName = fullName.split(" ")[0];

  await sendOne("send", {
    from: `"Somto from Ubuntu Bridge Initiative" <noreply@ubuntubridgeinitiatives.org>`,
    to,
    subject: "UBI Application Update",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0B1120;">

        <!-- Header -->
        <div style="padding: 48px 40px 32px; text-align: center;">
          <div style="display: inline-block; border: 2px solid #2563EB; border-radius: 12px; padding: 8px 12px; margin-bottom: 24px;">
            <span style="color: #2563EB; font-size: 20px; font-weight: 800; letter-spacing: 2px;">UBI</span>
          </div>
          <div style="width: 48px; height: 3px; background: linear-gradient(90deg, #2563EB, #0891B2); margin: 0 auto; border-radius: 2px;"></div>
        </div>

        <!-- Main Card -->
        <div style="background: #111827; margin: 0 20px; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden;">
          <div style="padding: 32px;">
            <h2 style="color: #F1F5F9; margin: 0 0 20px; font-size: 20px; font-weight: 700;">Hi ${firstName},</h2>

            <p style="color: #94A3B8; line-height: 1.8; margin: 0 0 16px; font-size: 15px;">
              Thank you for applying to the <span style="color: #F1F5F9; font-weight: 600;">UBI Cybersecurity Internship Programme</span>. We genuinely appreciate the time and effort you put into your application.
            </p>

            <p style="color: #94A3B8; line-height: 1.8; margin: 0 0 16px; font-size: 15px;">
              We received an overwhelming number of applications for Cohort 1 and the selection was extremely competitive. After careful review, we are unable to offer you a spot in this cohort.
            </p>

            <p style="color: #94A3B8; line-height: 1.8; margin: 0 0 24px; font-size: 15px;">
              This does not reflect your potential. Many strong candidates applied and we had to make difficult choices. We strongly encourage you to <span style="color: #F1F5F9; font-weight: 600;">keep building your skills</span> and apply again when we open applications for the next cohort.
            </p>

            <!-- Resources -->
            <div style="background: #0F172A; border-radius: 10px; padding: 20px; border: 1px solid #1E293B; margin-bottom: 24px;">
              <p style="color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 12px; font-weight: 600;">Keep sharpening your skills</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0;">
                    <span style="color: #2563EB; font-size: 14px; font-weight: 600;">TryHackMe</span>
                    <span style="color: #475569; font-size: 13px;"> — Guided learning paths</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; border-top: 1px solid #1E293B;">
                    <span style="color: #10B981; font-size: 14px; font-weight: 600;">Hack The Box</span>
                    <span style="color: #475569; font-size: 13px;"> — Hands-on challenges</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; border-top: 1px solid #1E293B;">
                    <span style="color: #F59E0B; font-size: 14px; font-weight: 600;">CyberDefenders</span>
                    <span style="color: #475569; font-size: 13px;"> — Blue team labs</span>
                  </td>
                </tr>
              </table>
            </div>

            <p style="color: #94A3B8; line-height: 1.8; margin: 0; font-size: 15px;">
              We are rooting for you, ${firstName}. The cybersecurity field is growing fast and there will be more opportunities. Keep going.
            </p>

            <p style="color: #64748B; margin: 24px 0 0; font-size: 14px;">
              &mdash; The UBI Team
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 32px 40px; text-align: center;">
          <p style="color: #475569; font-size: 12px; margin: 0; line-height: 1.6;">
            Ubuntu Bridge Initiative &bull; Remote<br/>
            &copy; 2025 UBI. All rights reserved.
          </p>
        </div>
      </div>
    `,
  });
}

// ─── BATCH EMAIL UTILITY ─────────────────────────────────
// Zoho free: ~50/day, paid: ~500-1500/day. Send with delays to avoid hitting limits.

export async function sendEmailBatch(
  emails: Array<{ to: string; fullName: string; trackInterest?: string }>,
  type: "acceptance" | "rejection",
  onProgress?: (sent: number, total: number, failed: string[]) => void
): Promise<{ sent: number; failed: string[] }> {
  const failed: string[] = [];
  let sent = 0;

  for (const email of emails) {
    try {
      if (type === "acceptance") {
        await sendPublicAcceptanceEmail(email.to, email.fullName, email.trackInterest || "your chosen track");
      } else {
        await sendPublicRejectionEmail(email.to, email.fullName);
      }
      sent++;
    } catch (err) {
      console.error(`Failed to send ${type} email to ${email.to}:`, err);
      failed.push(email.to);
    }

    // Delay between emails to respect rate limits (1 second gap)
    if (sent < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    onProgress?.(sent, emails.length, failed);
  }

  return { sent, failed };
}

// ─── COHORT NOTIFICATIONS ─────────────────────────────────
// Minimal, reusable HTML wrapper for transactional notifications.
function wrap(title: string, body: string, ctaUrl?: string, ctaLabel?: string): string {
  const cta = ctaUrl
    ? `<p style="margin:24px 0 0;"><a href="${ctaUrl}" style="display:inline-block;background:#2563EB;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">${ctaLabel ?? "Open dashboard"}</a></p>`
    : "";
  return `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#F8FAFC;padding:32px 16px;">
      <div style="background:linear-gradient(135deg,#2563EB,#0891B2);padding:28px;border-radius:14px;text-align:center;color:white;">
        <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;">🛡️ UBI</h1>
        <p style="margin:0;font-size:12px;opacity:.9;">Ubuntu Bridge Initiative</p>
      </div>
      <div style="background:white;padding:28px;border-radius:14px;margin-top:16px;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <h2 style="color:#0F172A;margin:0 0 12px;font-size:18px;">${title}</h2>
        <div style="color:#334155;line-height:1.55;font-size:14px;">${body}</div>
        ${cta}
      </div>
      <p style="color:#94A3B8;font-size:11px;text-align:center;margin-top:16px;">You are receiving this because you are enrolled in the UBI cohort.</p>
    </div>`;
}

function publicUrl(path: string): string {
  return `${publicAppUrl()}${path}`;
}

export async function sendAssignmentPublished(
  to: string,
  firstName: string,
  assignment: { title: string; dueDate: Date; maxPoints: number }
): Promise<void> {
  const due = assignment.dueDate.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  await sendOne("send", {
    from: FROM,
    to,
    subject: `New assignment: ${assignment.title}`,
    html: wrap(
      `New assignment for you, ${firstName}`,
      `<p><strong>${assignment.title}</strong> is now available. Due <strong>${due}</strong>. Worth up to ${assignment.maxPoints} points.</p>`,
      publicUrl("/dashboard/assignments"),
      "View assignment"
    ),
  });
}

export async function sendSubmissionReceipt(
  to: string,
  firstName: string,
  assignmentTitle: string,
  status: "SUBMITTED" | "LATE"
): Promise<void> {
  const lateNote =
    status === "LATE"
      ? `<p style="color:#B45309;"><strong>Note:</strong> this submission is past the due date and is marked LATE.</p>`
      : "";
  await sendOne("send", {
    from: FROM,
    to,
    subject: `Submission received — ${assignmentTitle}`,
    html: wrap(
      `Got it, ${firstName}`,
      `<p>We received your submission for <strong>${assignmentTitle}</strong>. You'll get another email once it's been graded.</p>${lateNote}`,
      publicUrl("/dashboard/assignments"),
      "View submissions"
    ),
  });
}

export async function sendGradeNotification(
  to: string,
  firstName: string,
  assignmentTitle: string,
  score: number,
  maxPoints: number,
  feedback: string | null
): Promise<void> {
  const fb = feedback
    ? `<div style="margin-top:12px;padding:12px;background:#F1F5F9;border-radius:10px;"><strong>Feedback:</strong><br>${feedback}</div>`
    : "";
  await sendOne("send", {
    from: FROM,
    to,
    subject: `Graded: ${assignmentTitle} — ${score}/${maxPoints}`,
    html: wrap(
      `Your grade is in, ${firstName}`,
      `<p><strong>${assignmentTitle}</strong> has been graded.</p><p style="font-size:28px;font-weight:700;color:#2563EB;margin:12px 0;">${score} / ${maxPoints}</p>${fb}`,
      publicUrl("/dashboard/assignments"),
      "See details"
    ),
  });
}

// ─── STAGE DOOR / ROOM PROGRESSION ───────────────────────

export async function sendStageDoorCode(
  to: string,
  firstName: string,
  internCode: string,
  doorCode: string
): Promise<void> {
  const rules = [
    { stage: "Stage 0", rule: "plain text", example: doorCode },
    { stage: "Stage 1", rule: "base64 encoded", example: Buffer.from(doorCode).toString("base64") },
    {
      stage: "Stage 2",
      rule: "each character as 8-bit binary",
      example: Array.from(doorCode)
        .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
        .join(" "),
    },
    { stage: "Stage 3", rule: "hex of UTF-8 bytes", example: Buffer.from(doorCode).toString("hex") },
    {
      stage: "Stage 4",
      rule: "ROT13 then base64",
      example: Buffer.from(
        doorCode.replace(/[a-zA-Z]/g, (c) => {
          const base = c >= "a" ? 97 : 65;
          return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
        })
      ).toString("base64"),
    },
  ];
  const rows = rules
    .map(
      (r) => `
        <tr>
          <td style="padding:6px 10px;border-top:1px solid #1E293B;color:#94A3B8;font-size:12px;">${r.stage}</td>
          <td style="padding:6px 10px;border-top:1px solid #1E293B;color:#F1F5F9;font-size:12px;">${r.rule}</td>
          <td style="padding:6px 10px;border-top:1px solid #1E293B;color:#34D399;font-size:12px;font-family:'SF Mono',monospace;word-break:break-all;">${r.example}</td>
        </tr>`
    )
    .join("");
  await sendOne("send", {
    from: FROM,
    to,
    subject: "Your stage-door password — TRAN foundation rooms",
    html: wrap(
      `Stage access credentials, ${firstName}`,
      `
        <p>Each foundation room (Stage 0 through Stage 4) has its own front door. You unlock every door with the <strong>same word</strong>, but each stage accepts it in a different encoding — a mini crypto warmup before the room even begins.</p>
        <div style="background:#0F172A;border:1px solid #1E293B;border-radius:12px;padding:14px;margin:14px 0;">
          <p style="color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px;">Your password</p>
          <p style="color:#F59E0B;font-size:20px;font-weight:700;font-family:'SF Mono',monospace;margin:0;">${doorCode}</p>
          <p style="color:#94A3B8;font-size:12px;margin:6px 0 0;">Intern ID: <strong style="color:#F1F5F9;font-family:'SF Mono',monospace;">${internCode}</strong></p>
        </div>
        <table style="width:100%;border-collapse:collapse;background:#0B1220;border:1px solid #1E293B;border-radius:10px;overflow:hidden;">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px 10px;background:#0F172A;color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;">Room</th>
              <th style="text-align:left;padding:8px 10px;background:#0F172A;color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;">Encoding</th>
              <th style="text-align:left;padding:8px 10px;background:#0F172A;color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;">What to paste</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:12px;font-size:12px;color:#94A3B8;">Each room has its own hidden path. You will receive the exact link for the next stage when it opens. Keep this email safe — it is also how you log in if you forget your credentials.</p>
      `
    ),
  });
}

export async function sendStageAdvanced(
  to: string,
  firstName: string,
  fromStage: string,
  toStage: string,
  earned: number,
  maxPoints: number
): Promise<void> {
  await sendOne("send", {
    from: FROM,
    to,
    subject: `Advanced to ${toStage.replace("STAGE_", "Stage ")} — TRAN`,
    html: wrap(
      `Onward to ${toStage.replace("STAGE_", "Stage ")}, ${firstName}`,
      `<p>You cleared <strong>${fromStage.replace("STAGE_", "Stage ")}</strong> with <strong>${earned}/${maxPoints}</strong> points. The next room is unlocked.</p>`,
      publicUrl("/dashboard/rooms"),
      "Open next room"
    ),
  });
}

export async function sendEliminationEmail(
  to: string,
  firstName: string,
  earned: number,
  maxPoints: number
): Promise<void> {
  await sendOne("send", {
    from: FROM,
    to,
    subject: "TRAN capstone outcome",
    html: wrap(
      `Hi ${firstName},`,
      `<p>You scored <strong>${earned}/${maxPoints}</strong> on the capstone room. Unfortunately that falls below the 50% threshold, and we're unable to advance you into the specialisation track for this cohort.</p><p>Your progress so far is still yours — keep the notes, keep the writeups, keep sharpening. We'd love to see you in the next intake.</p>`
    ),
  });
}

export async function sendAnnouncementBroadcast(
  recipients: string[],
  subject: string,
  title: string,
  content: string
): Promise<{ sent: number; failed: string[] }> {
  return sendCohortBroadcast(recipients, subject, wrap(
    title,
    `<p>${content.replace(/\n/g, "<br>")}</p>`,
    publicUrl("/dashboard"),
    "Open dashboard"
  ));
}

/**
 * Cohort broadcast via BCC chunks. 5000 recipients @ 90/batch = ~56 sends.
 * Zoho paid caps ~500-1500/day, so a single cohort broadcast fits in one day.
 * Each send goes TO the sender with recipients in BCC so addresses stay private.
 */
const BCC_CHUNK_SIZE = 90;
const DELAY_MS = 1200;

export async function sendCohortBroadcast(
  recipients: string[],
  subject: string,
  html: string
): Promise<{ sent: number; failed: string[] }> {
  const failed: string[] = [];
  let sent = 0;

  const unique = Array.from(new Set(recipients.map((r) => r.trim().toLowerCase()).filter(Boolean)));

  for (let i = 0; i < unique.length; i += BCC_CHUNK_SIZE) {
    const batch = unique.slice(i, i + BCC_CHUNK_SIZE);
    try {
      await sendOne("send", {
        from: FROM,
        to: FROM, // Sender acts as visible recipient; real recipients are BCC'd.
        bcc: batch,
        subject,
        html,
      });
      sent += batch.length;
    } catch (err) {
      logger.error("cohort_broadcast_batch_failed", err, { batchStart: i, batchSize: batch.length });
      for (const addr of batch) failed.push(addr);
    }
    if (i + BCC_CHUNK_SIZE < unique.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  return { sent, failed };
}

/**
 * Fire-and-forget wrapper for cohort notifications. Used in request handlers
 * that shouldn't block on a multi-minute email fanout.
 */
export function scheduleCohortBroadcast(
  recipients: string[],
  subject: string,
  html: string,
  tag: string
): void {
  sendCohortBroadcast(recipients, subject, html)
    .then(({ sent, failed }) => {
      logger.info("cohort_broadcast_complete", { tag, sent, failedCount: failed.length });
    })
    .catch((err) => logger.error("cohort_broadcast_failed", err, { tag }));
}
