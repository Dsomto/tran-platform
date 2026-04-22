import nodemailer from "nodemailer";
import { logger } from "./logger";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.zoho.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Reuse TCP connection for fanouts; Zoho allows several emails per connection.
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
});

const FROM = `"Ubuntu Bridge Initiative" <${process.env.SMTP_USER}>`;

export async function sendApplicationConfirmation(
  to: string,
  fullName: string
): Promise<void> {
  const firstName = fullName.split(" ")[0];

  await transporter.sendMail({
    from: `"Ubuntu Bridge Initiative" <${process.env.SMTP_USER}>`,
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
  await transporter.sendMail({
    from: `"Ubuntu Bridge Initiative" <${process.env.SMTP_USER}>`,
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
          <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #2563EB, #0891B2); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
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
  await transporter.sendMail({
    from: `"Ubuntu Bridge Initiative" <${process.env.SMTP_USER}>`,
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

export async function sendPublicAcceptanceEmail(
  to: string,
  fullName: string,
  trackInterest: string,
  internId?: string,
  tempPassword?: string,
  pdfBuffer?: Buffer
): Promise<void> {
  const firstName = fullName.split(" ")[0];
  const baseUrl = process.env.NEXTAUTH_URL || "https://ubinitiative.org";
  const letterUrl = `${baseUrl}/letter/acceptance?name=${encodeURIComponent(fullName)}&track=${encodeURIComponent(trackInterest)}`;

  const attachments = pdfBuffer
    ? [
        {
          filename: `UBI_Acceptance_Letter_${fullName.replace(/\s+/g, "_")}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf" as const,
        },
      ]
    : [];

  await transporter.sendMail({
    from: `"Ubuntu Bridge Initiative" <${process.env.SMTP_USER}>`,
    to,
    subject: "You're In! Welcome to UBI Cohort 1",
    attachments,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0B1120;">

        <!-- Header -->
        <div style="padding: 48px 40px 32px; text-align: center;">
          <div style="display: inline-block; border: 2px solid #2563EB; border-radius: 12px; padding: 8px 12px; margin-bottom: 24px;">
            <span style="color: #2563EB; font-size: 20px; font-weight: 800; letter-spacing: 2px;">UBI</span>
          </div>
          <h1 style="color: #F8FAFC; margin: 0 0 8px; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Welcome to Cohort 1</h1>
          <div style="width: 48px; height: 3px; background: linear-gradient(90deg, #2563EB, #0891B2); margin: 16px auto 0; border-radius: 2px;"></div>
        </div>

        <!-- Main Card -->
        <div style="background: #111827; margin: 0 20px; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden;">

          <!-- Greeting -->
          <div style="padding: 32px 32px 24px;">
            <p style="color: #2563EB; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px;">Application Accepted</p>
            <h2 style="color: #F1F5F9; margin: 0 0 16px; font-size: 22px; font-weight: 700;">${firstName}, you made the cut.</h2>
            <p style="color: #94A3B8; line-height: 1.7; margin: 0; font-size: 15px;">
              Out of thousands of applications, yours stood out. You have been selected to join the <span style="color: #F1F5F9; font-weight: 600;">UBI Cybersecurity Internship Programme</span> — a 10-stage, elimination-based programme that will transform you into a job-ready cybersecurity professional.
            </p>
          </div>

          <!-- Key Dates -->
          <div style="background: #0F172A; margin: 0 20px; border-radius: 12px; padding: 24px; border: 1px solid #1E293B;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; vertical-align: top; width: 28px;">
                  <div style="width: 8px; height: 8px; background: #2563EB; border-radius: 50%; margin-top: 4px;"></div>
                </td>
                <td style="padding: 12px 0;">
                  <p style="color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 2px;">Orientation</p>
                  <p style="color: #F1F5F9; font-size: 15px; font-weight: 600; margin: 0;">Friday, 30th May 2025</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; vertical-align: top; border-top: 1px solid #1E293B;">
                  <div style="width: 8px; height: 8px; background: #10B981; border-radius: 50%; margin-top: 4px;"></div>
                </td>
                <td style="padding: 12px 0; border-top: 1px solid #1E293B;">
                  <p style="color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 2px;">Programme Starts</p>
                  <p style="color: #F1F5F9; font-size: 15px; font-weight: 600; margin: 0;">Sunday, 1st June 2025</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; vertical-align: top; border-top: 1px solid #1E293B;">
                  <div style="width: 8px; height: 8px; background: #F59E0B; border-radius: 50%; margin-top: 4px;"></div>
                </td>
                <td style="padding: 12px 0; border-top: 1px solid #1E293B;">
                  <p style="color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 2px;">Your Track</p>
                  <p style="color: #F59E0B; font-size: 15px; font-weight: 600; margin: 0;">${trackInterest}</p>
                </td>
              </tr>
            </table>
          </div>

          <!-- Milestones -->
          <div style="padding: 28px 32px;">
            <p style="color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 16px; font-weight: 600;">What you unlock</p>

            <div style="margin-bottom: 16px; padding: 16px; background: #0F172A; border-radius: 10px; border-left: 3px solid #10B981;">
              <p style="color: #10B981; font-size: 12px; font-weight: 700; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px;">Stage 5 — Alumni Network</p>
              <p style="color: #94A3B8; font-size: 13px; line-height: 1.6; margin: 0;">
                Job-readiness programmes, exclusive workshops, and direct connections with industry professionals across Africa.
              </p>
            </div>

            <div style="padding: 16px; background: #0F172A; border-radius: 10px; border-left: 3px solid #F59E0B;">
              <p style="color: #F59E0B; font-size: 12px; font-weight: 700; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px;">Finalist — Top Tier</p>
              <p style="color: #94A3B8; font-size: 13px; line-height: 1.6; margin: 0;">
                1-on-1 mentorship, hardware (laptops), and priority placement on our Hire page — finalists get chosen first for jobs.
              </p>
            </div>
          </div>

          ${internId && tempPassword ? `
          <!-- Credentials -->
          <div style="margin: 0 20px 24px; background: #2563EB; border-radius: 12px; padding: 24px; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: rgba(255,255,255,0.08); border-radius: 50%;"></div>
            <p style="color: rgba(255,255,255,0.7); font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 16px; font-weight: 600;">Your Login Credentials</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: rgba(255,255,255,0.6); font-size: 12px;">Intern ID</td>
                <td style="padding: 8px 0; color: #FFFFFF; font-size: 16px; font-weight: 700; font-family: 'SF Mono', 'Fira Code', monospace; text-align: right;">${internId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: rgba(255,255,255,0.6); font-size: 12px; border-top: 1px solid rgba(255,255,255,0.15);">Password</td>
                <td style="padding: 8px 0; color: #FFFFFF; font-size: 16px; font-weight: 700; font-family: 'SF Mono', 'Fira Code', monospace; text-align: right; border-top: 1px solid rgba(255,255,255,0.15);">${tempPassword}</td>
              </tr>
            </table>
            <p style="color: rgba(255,255,255,0.5); margin: 14px 0 0; font-size: 11px;">You will be required to change your password on first login. Do not share these credentials.</p>
          </div>
          ` : ""}

          <!-- Important Notice -->
          <div style="margin: 0 20px 24px; padding: 16px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 10px;">
            <p style="color: #FCA5A5; font-size: 13px; line-height: 1.6; margin: 0;">
              <strong style="color: #F87171;">Mandatory:</strong> Attend orientation on 30th May. The programme is elimination-based — meet the requirements at each stage or face elimination. Slack invite and onboarding details will follow.
            </p>
          </div>

          <!-- CTA -->
          <div style="padding: 0 32px 32px; text-align: center;">
            <a href="${letterUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563EB, #1D4ED8); color: white; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 0.3px;">
              View Acceptance Letter &rarr;
            </a>
            <p style="color: #475569; font-size: 12px; margin: 12px 0 0;">Your acceptance letter is attached to this email as a PDF.</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 32px 40px; text-align: center;">
          <p style="color: #475569; font-size: 12px; margin: 0; line-height: 1.6;">
            Ubuntu Bridge Initiative &bull; Lagos, Nigeria<br/>
            &copy; 2025 UBI. All rights reserved.
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendPublicRejectionEmail(
  to: string,
  fullName: string
): Promise<void> {
  const firstName = fullName.split(" ")[0];

  await transporter.sendMail({
    from: `"Ubuntu Bridge Initiative" <${process.env.SMTP_USER}>`,
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
            Ubuntu Bridge Initiative &bull; Lagos, Nigeria<br/>
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
  const base = process.env.PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  return `${base}${path}`;
}

export async function sendAssignmentPublished(
  to: string,
  firstName: string,
  assignment: { title: string; dueDate: Date; maxPoints: number }
): Promise<void> {
  const due = assignment.dueDate.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  await transporter.sendMail({
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
  await transporter.sendMail({
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
  await transporter.sendMail({
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
  await transporter.sendMail({
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
  await transporter.sendMail({
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
  await transporter.sendMail({
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
      await transporter.sendMail({
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
