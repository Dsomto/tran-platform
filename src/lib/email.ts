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
    subject: "We've received your application — UBI",
    html: `
      <div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; background: #F1F5F9; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto;">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0891B2 100%); padding: 48px 32px; border-radius: 18px 18px 0 0; text-align: center; color: white;">
            <div style="display: inline-block; padding: 6px 14px; border: 1.5px solid rgba(255,255,255,0.3); border-radius: 999px; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 18px;">Ubuntu Bridge Initiative</div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">UBI</h1>
            <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.7; letter-spacing: 1px;">CYBERSECURITY INTERNSHIP PROGRAMME</p>
          </div>

          <!-- Card -->
          <div style="background: white; padding: 40px 36px; border-radius: 0 0 18px 18px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);">

            <p style="color: #2563EB; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin: 0 0 8px;">Application received</p>
            <h2 style="color: #0F172A; margin: 0 0 20px; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.25;">You're on the list, ${firstName}.</h2>

            <p style="color: #475569; line-height: 1.75; margin: 0 0 20px; font-size: 15px;">
              Thanks for applying to the UBI Cybersecurity Internship Programme. Your application is in the queue and our team will review it carefully.
            </p>

            <!-- Timeline -->
            <div style="margin: 32px 0; padding: 24px; background: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0;">
              <p style="color: #0F172A; margin: 0 0 16px; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">What happens now</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: top; padding: 10px 0; width: 36px;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background: #2563EB; color: white; text-align: center; line-height: 28px; font-weight: 700; font-size: 13px;">1</div>
                  </td>
                  <td style="vertical-align: top; padding: 10px 0;">
                    <p style="color: #0F172A; margin: 0 0 2px; font-size: 14px; font-weight: 600;">We review every application individually</p>
                    <p style="color: #64748B; margin: 0; font-size: 13px; line-height: 1.6;">This usually takes a few days. We read every word.</p>
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align: top; padding: 10px 0;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background: #0891B2; color: white; text-align: center; line-height: 28px; font-weight: 700; font-size: 13px;">2</div>
                  </td>
                  <td style="vertical-align: top; padding: 10px 0;">
                    <p style="color: #0F172A; margin: 0 0 2px; font-size: 14px; font-weight: 600;">If you make it through</p>
                    <p style="color: #64748B; margin: 0; font-size: 13px; line-height: 1.6;">You'll receive a welcome email with your login credentials and orientation details.</p>
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align: top; padding: 10px 0;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background: #64748B; color: white; text-align: center; line-height: 28px; font-weight: 700; font-size: 13px;">3</div>
                  </td>
                  <td style="vertical-align: top; padding: 10px 0;">
                    <p style="color: #0F172A; margin: 0 0 2px; font-size: 14px; font-weight: 600;">Either way, stay close</p>
                    <p style="color: #64748B; margin: 0; font-size: 13px; line-height: 1.6;">We periodically send free workshop invitations to everyone who applied.</p>
                  </td>
                </tr>
              </table>
            </div>

            <p style="color: #475569; line-height: 1.75; margin: 0 0 24px; font-size: 15px;">
              In the meantime, stay sharp. Read, build, break things in safe environments. The work you do before you're admitted shows up later.
            </p>

            <p style="color: #334155; line-height: 1.7; margin: 28px 0 4px; font-size: 15px;">
              Talk soon,
            </p>
            <p style="color: #0F172A; line-height: 1.5; margin: 0; font-size: 15px; font-weight: 600;">
              Somto Okoma
            </p>
            <p style="color: #64748B; line-height: 1.5; margin: 0; font-size: 13px;">
              Head of Programme, Ubuntu Bridge Initiative
            </p>
          </div>

          <!-- Footer -->
          <p style="text-align: center; color: #94A3B8; font-size: 11px; margin: 24px 0 0; letter-spacing: 0.3px;">
            Ubuntu Bridge Initiative &middot; Building the next generation of cybersecurity professionals
          </p>
        </div>
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

// ─── PASSWORD RESET ──────────────────────────────────────

export async function sendPasswordResetEmail(opts: {
  to: string;
  firstName: string;
  resetUrl: string;
}): Promise<void> {
  const { to, firstName, resetUrl } = opts;
  await sendOne("send", {
    from: `"Somto from Ubuntu Bridge Initiative" <noreply@ubuntubridgeinitiatives.org>`,
    to,
    subject: "Reset your UBI password",
    html: `
      <div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; background: #F1F5F9; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #2563EB 100%); padding: 40px 32px; border-radius: 18px 18px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Reset your password</h1>
          </div>
          <div style="background: white; padding: 36px 32px; border-radius: 0 0 18px 18px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);">
            <p style="color: #475569; line-height: 1.7; margin: 0 0 16px; font-size: 15px;">Hi ${firstName},</p>
            <p style="color: #334155; line-height: 1.7; margin: 0 0 16px; font-size: 15px;">
              Someone (hopefully you) asked to reset the password on your UBI account. Click the button below to set a new password. The link expires in 1 hour.
            </p>
            <p style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #2563EB; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Reset password
              </a>
            </p>
            <p style="color: #64748B; line-height: 1.7; margin: 0 0 12px; font-size: 13px;">
              If the button doesn't work, paste this link in your browser:
            </p>
            <p style="color: #2563EB; line-height: 1.5; margin: 0 0 16px; font-size: 12px; word-break: break-all;">
              ${resetUrl}
            </p>
            <p style="color: #64748B; line-height: 1.7; margin: 24px 0 0; font-size: 13px;">
              If you didn't request this, you can safely ignore this email — your password won't change unless someone clicks the link and sets a new one.
            </p>
          </div>
          <p style="text-align: center; color: #94A3B8; font-size: 11px; margin: 24px 0 0;">
            Ubuntu Bridge Initiative
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
// Sponsor acknowledgment — credits Peter Ejiofor / Ethnos Cyber, whose
// sponsorship funds the programme. Reused in the acceptance and rejection
// emails. Edit the copy here to update both.
const SPONSOR_BLOCK = `
            <!-- Sponsor acknowledgment -->
            <div style="margin: 28px 0; padding: 22px 24px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px;">
              <p style="color: #475569; margin: 0 0 6px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Made possible by our sponsor</p>
              <p style="color: #334155; margin: 0 0 12px; font-size: 14px; line-height: 1.7;">
                This programme is sponsored by <strong>Peter Ejiofor</strong>, Founder &amp; CEO of <strong>Ethnos Cyber Limited</strong> — a cybersecurity leader with 15+ years in information security and a recipient of the African Leadership Excellence Award. His backing is why this programme is free for everyone who takes part. We&apos;re deeply grateful.
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 1.7;">
                <a href="https://scanone.ethnoscyber.com" style="color: #2563EB; font-weight: 600; text-decoration: none;">Check out ScanOne by Ethnos Cyber → scanone.ethnoscyber.com</a>
              </p>
            </div>`;

export function renderPublicAcceptanceEmail(opts: {
  fullName: string;
  trackInterest: string;
  internId?: string;
  tempPassword?: string;
}): { subject: string; html: string } {
  const { fullName, trackInterest } = opts;
  const firstName = fullName.split(" ")[0];
  const sig = signLetter(fullName, trackInterest);
  const letterUrl = `${publicAppUrl()}/letter/acceptance?name=${encodeURIComponent(fullName)}&track=${encodeURIComponent(trackInterest)}&sig=${sig}`;

  return {
    subject: "Welcome to UBI — your access to Cohort 1",
    html: `
      <div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; background: #F1F5F9; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto;">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #2563EB 100%); padding: 48px 32px; border-radius: 18px 18px 0 0; text-align: center; color: white;">
            <div style="display: inline-block; padding: 6px 14px; border: 1.5px solid rgba(255,255,255,0.3); border-radius: 999px; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 18px;">Cohort 1 · ${trackInterest}</div>
            <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.8px;">You're in.</h1>
            <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.75;">Welcome to the Ubuntu Bridge Initiative.</p>
          </div>

          <!-- Card -->
          <div style="background: white; padding: 40px 36px; border-radius: 0 0 18px 18px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);">

            <p style="color: #475569; line-height: 1.75; margin: 0 0 18px; font-size: 15px;">
              Hi ${firstName},
            </p>

            <p style="color: #334155; line-height: 1.75; margin: 0 0 18px; font-size: 15px;">
              I'm Somto, and I lead the programme here. Your application made it through review — you're officially part of <strong>UBI Cohort 1</strong> on the <strong>${trackInterest}</strong> track.
            </p>

            <p style="color: #334155; line-height: 1.75; margin: 0 0 18px; font-size: 15px;">
              We're putting in the work to make sure you come out of this programme job-ready. Here's what that looks like.
            </p>

            <!-- "You pay nothing" highlight -->
            <div style="margin: 28px 0; padding: 22px 24px; background: linear-gradient(135deg, #ECFDF5, #F0FDF4); border-left: 4px solid #10B981; border-radius: 10px;">
              <p style="color: #065F46; margin: 0 0 6px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Free, ever</p>
              <p style="color: #064E3B; margin: 0; font-size: 14px; line-height: 1.7;">
                No tuition. No application fee. No data bill if you qualify for the scholarship. Your only cost is the time and effort you put in.
              </p>
            </div>

            <!-- Programme structure -->
            <h3 style="color: #0F172A; margin: 28px 0 10px; font-size: 17px; font-weight: 700;">10 stages. Elimination-based.</h3>
            <p style="color: #475569; line-height: 1.75; margin: 0 0 14px; font-size: 14px;">
              Each stage tests what you've absorbed and decides whether you advance. Only the participants doing the work move forward. It's competitive by design — the credential we're building has to mean something to the recruiters who hire you.
            </p>

            <!-- Milestones -->
            <h3 style="color: #0F172A; margin: 28px 0 10px; font-size: 17px; font-weight: 700;">What you unlock as you progress</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 12px 0 8px;">
              <tr>
                <td style="vertical-align: top; padding: 12px 0; width: 4px;">
                  <div style="width: 4px; height: 100%; background: #10B981; border-radius: 2px;"></div>
                </td>
                <td style="vertical-align: top; padding: 12px 0 12px 16px;">
                  <p style="color: #065F46; margin: 0 0 4px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">After Stage 0</p>
                  <p style="color: #0F172A; margin: 0 0 4px; font-size: 15px; font-weight: 600;">Alumni Network access</p>
                  <p style="color: #64748B; margin: 0; font-size: 13px; line-height: 1.7;">Once you clear Stage 0, you're in the UBI Alumni Network: structured job-readiness programmes, exclusive workshops, and direct connections with cybersecurity professionals.</p>
                </td>
              </tr>
              <tr>
                <td style="vertical-align: top; padding: 12px 0; width: 4px;">
                  <div style="width: 4px; height: 100%; background: #F59E0B; border-radius: 2px;"></div>
                </td>
                <td style="vertical-align: top; padding: 12px 0 12px 16px;">
                  <p style="color: #92400E; margin: 0 0 4px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Finalists</p>
                  <p style="color: #0F172A; margin: 0 0 4px; font-size: 15px; font-weight: 600;">Top tier benefits</p>
                  <p style="color: #64748B; margin: 0; font-size: 13px; line-height: 1.7;">Sponsored industry certifications, 1-on-1 mentorship from senior practitioners, hardware (laptops where needed), and priority placement on our Hire page. Finalists get chosen first for jobs in our network.</p>
                </td>
              </tr>
            </table>

            <!-- What's next -->
            <h3 style="color: #0F172A; margin: 28px 0 10px; font-size: 17px; font-weight: 700;">What's next</h3>
            <p style="color: #475569; line-height: 1.75; margin: 0 0 14px; font-size: 14px;">
              For now, let it land — <strong>you made it.</strong> Out of thousands of applications, yours stood out. So go celebrate it: <strong>post it on your socials</strong> and let the world know you're in UBI Cohort 1. Tag us and we'll cheer you on. 🎉
            </p>
            <p style="color: #475569; line-height: 1.75; margin: 0 0 14px; font-size: 14px;">
              Your login details and dashboard access are coming in a separate email shortly, together with the orientation and programme start dates. Keep an eye on your inbox.
            </p>

            <p style="color: #475569; line-height: 1.75; margin: 28px 0 14px; font-size: 14px;">
              Your formal acceptance letter is here:
              <br/>
              <a href="${letterUrl}" style="color: #2563EB; word-break: break-all;">${letterUrl}</a>
            </p>
${SPONSOR_BLOCK}
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 32px 0 24px;" />

            <p style="color: #334155; line-height: 1.7; margin: 0 0 4px; font-size: 15px;">
              Welcome aboard. Looking forward to seeing what you build.
            </p>
            <p style="color: #0F172A; line-height: 1.5; margin: 16px 0 0; font-size: 15px; font-weight: 600;">
              — Somto Okoma
            </p>
            <p style="color: #64748B; line-height: 1.5; margin: 0; font-size: 13px;">
              Head of Programme, Ubuntu Bridge Initiative
            </p>
          </div>

          <!-- Footer -->
          <p style="text-align: center; color: #94A3B8; font-size: 11px; margin: 24px 0 0; letter-spacing: 0.3px;">
            Ubuntu Bridge Initiative &middot; Building the next generation of cybersecurity professionals
          </p>
        </div>
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

// Render the rejection email body. Returns subject + html so the same content
// can be delivered directly OR enqueued in EmailQueueItem for retry — mirrors
// renderPublicAcceptanceEmail.
export function renderPublicRejectionEmail(opts: {
  fullName: string;
  // Up to two gentle, specific reasons (from rejectionReasons). When present
  // they render as a soft "a little context" block; when omitted the email
  // carries only its generic competitiveness line.
  reasons?: string[];
}): { subject: string; html: string } {
  const firstName = opts.fullName.split(" ")[0];
  const reasons = (opts.reasons ?? []).filter(Boolean);
  const reasonsBlock =
    reasons.length === 0
      ? ""
      : `
            <!-- Gentle, specific context -->
            <div style="margin: 28px 0; padding: 22px 24px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px;">
              <p style="color: #475569; margin: 0 0 10px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">If it helps for next time</p>
              <p style="color: #475569; margin: 0 0 14px; font-size: 14px; line-height: 1.7;">
                Please don&apos;t take ${
                  reasons.length === 1 ? "this" : "these"
                } as the reason you weren&apos;t selected — think of ${
                  reasons.length === 1 ? "it" : "them"
                } as a small, optional nudge for your next application:
              </p>
              <ul style="color: #334155; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.7;">
                ${reasons
                  .map((r) => `<li style="margin-bottom: 8px;">${r}</li>`)
                  .join("\n                ")}
              </ul>
            </div>`;
  return {
    subject: "UBI application update — and what's next",
    html: `
      <div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; background: #F1F5F9; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto;">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #475569 100%); padding: 48px 32px; border-radius: 18px 18px 0 0; text-align: center; color: white;">
            <div style="display: inline-block; padding: 6px 14px; border: 1.5px solid rgba(255,255,255,0.3); border-radius: 999px; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 18px;">Ubuntu Bridge Initiative</div>
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Thank you for applying.</h1>
            <p style="margin: 8px 0 0; font-size: 13px; opacity: 0.7;">An update on your Cohort 1 application</p>
          </div>

          <!-- Card -->
          <div style="background: white; padding: 40px 36px; border-radius: 0 0 18px 18px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);">

            <p style="color: #475569; line-height: 1.75; margin: 0 0 18px; font-size: 15px;">
              Hi ${firstName},
            </p>

            <p style="color: #334155; line-height: 1.75; margin: 0 0 18px; font-size: 15px;">
              Thank you for applying to the UBI Cybersecurity Internship Programme. After careful review, I'm sorry to share that <strong>you didn't make it through this round</strong>.
            </p>

            <p style="color: #334155; line-height: 1.75; margin: 0 0 18px; font-size: 15px;">
              This is not a judgment of your ability or your effort. We received an enormous number of applications for very few places, and the hardest part of this whole process was turning away people we genuinely believed in. For many reading this exact email, there was nothing wrong with your application at all — we simply ran out of room. For others it came down to fit or timing this round. Please don&apos;t read it as a verdict on you.
            </p>
${reasonsBlock}
            <!-- Apply again callout -->
            <div style="margin: 28px 0; padding: 22px 24px; background: linear-gradient(135deg, #EFF6FF, #DBEAFE); border-left: 4px solid #2563EB; border-radius: 10px;">
              <p style="color: #1E40AF; margin: 0 0 6px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Try again next cohort</p>
              <p style="color: #1E3A8A; margin: 0; font-size: 14px; line-height: 1.7;">
                Many of our strongest interns are people who were rejected the first time and came back sharper. Please apply again when applications open for the next cohort. We'd love to see you back.
              </p>
            </div>

            <!-- Stay close callout (workshops) -->
            <div style="margin: 28px 0; padding: 22px 24px; background: linear-gradient(135deg, #ECFDF5, #F0FDF4); border-left: 4px solid #10B981; border-radius: 10px;">
              <p style="color: #065F46; margin: 0 0 6px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Stay in the loop</p>
              <p style="color: #064E3B; margin: 0; font-size: 14px; line-height: 1.7;">
                We&apos;ll be running <strong>free cybersecurity workshops</strong> and sharing other opportunities over the coming months. To make sure they reach you, please <strong>don&apos;t block or unsubscribe from this email</strong> — keep it open and we&apos;ll keep you posted.
              </p>
            </div>

            <p style="color: #334155; line-height: 1.75; margin: 24px 0 18px; font-size: 15px;">
              In the meantime: read, build, break things in safe environments. The skills compound. The next time you apply, the work you've been doing in between will show up clearly in your application — and we'll be ready to see it.
            </p>
${SPONSOR_BLOCK}
            <p style="color: #334155; line-height: 1.75; margin: 24px 0 4px; font-size: 15px;">
              Wishing you the best, ${firstName}.
            </p>
            <p style="color: #0F172A; line-height: 1.5; margin: 16px 0 0; font-size: 15px; font-weight: 600;">
              — Somto Okoma
            </p>
            <p style="color: #64748B; line-height: 1.5; margin: 0; font-size: 13px;">
              Head of Programme, Ubuntu Bridge Initiative
            </p>
          </div>

          <!-- Footer -->
          <p style="text-align: center; color: #94A3B8; font-size: 11px; margin: 24px 0 0; letter-spacing: 0.3px;">
            Ubuntu Bridge Initiative &middot; Building the next generation of cybersecurity professionals
          </p>
        </div>
      </div>
    `,
  };
}

// Render the waitlist email body. A waitlist decision is neither a yes nor a
// no — the applicant is held for a later look — so the copy is deliberately
// warm and hopeful. Returns subject + html so it can be enqueued like the
// other public-application emails.
export function renderPublicWaitlistEmail(opts: {
  fullName: string;
  trackInterest: string;
}): { subject: string; html: string } {
  const firstName = opts.fullName.split(" ")[0];
  return {
    subject: "UBI Cohort 1 — you're on the waitlist",
    html: `
      <div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; background: #F1F5F9; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto;">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #B45309 100%); padding: 48px 32px; border-radius: 18px 18px 0 0; text-align: center; color: white;">
            <div style="display: inline-block; padding: 6px 14px; border: 1.5px solid rgba(255,255,255,0.3); border-radius: 999px; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 18px;">Cohort 1 · ${opts.trackInterest}</div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">You're on the waitlist.</h1>
            <p style="margin: 8px 0 0; font-size: 13px; opacity: 0.75;">An update on your Cohort 1 application</p>
          </div>

          <!-- Card -->
          <div style="background: white; padding: 40px 36px; border-radius: 0 0 18px 18px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);">

            <p style="color: #475569; line-height: 1.75; margin: 0 0 18px; font-size: 15px;">
              Hi ${firstName},
            </p>

            <p style="color: #334155; line-height: 1.75; margin: 0 0 18px; font-size: 15px;">
              I want to be straight with you: <strong>this is not a no — and it's not yet a yes.</strong> You've been placed on the <strong>waitlist</strong> for UBI Cohort 1.
            </p>

            <p style="color: #334155; line-height: 1.75; margin: 0 0 18px; font-size: 15px;">
              We received an enormous number of strong applications and only had so many seats to start. Yours was good enough that we didn't want to let it go — so we're holding it. As places open up, we move through the waitlist, and you're on it.
            </p>

            <!-- What this means -->
            <div style="margin: 28px 0; padding: 22px 24px; background: linear-gradient(135deg, #FFFBEB, #FEF3C7); border-left: 4px solid #F59E0B; border-radius: 10px;">
              <p style="color: #92400E; margin: 0 0 6px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">What this means</p>
              <p style="color: #78350F; margin: 0; font-size: 14px; line-height: 1.7;">
                You don't need to do anything right now. If a place opens for your track, we'll email you directly with the next steps. Keep this inbox open — that's where the next update will land.
              </p>
            </div>

            <p style="color: #334155; line-height: 1.75; margin: 24px 0 18px; font-size: 15px;">
              In the meantime: keep building. Read, practise, break things in safe environments. If you're offered a place, the work you've been doing in between will only make your start stronger.
            </p>
${SPONSOR_BLOCK}
            <p style="color: #334155; line-height: 1.75; margin: 24px 0 4px; font-size: 15px;">
              Thank you for your patience, ${firstName} — and for wanting to be here.
            </p>
            <p style="color: #0F172A; line-height: 1.5; margin: 16px 0 0; font-size: 15px; font-weight: 600;">
              — Somto Okoma
            </p>
            <p style="color: #64748B; line-height: 1.5; margin: 0; font-size: 13px;">
              Head of Programme, Ubuntu Bridge Initiative
            </p>
          </div>

          <!-- Footer -->
          <p style="text-align: center; color: #94A3B8; font-size: 11px; margin: 24px 0 0; letter-spacing: 0.3px;">
            Ubuntu Bridge Initiative &middot; Building the next generation of cybersecurity professionals
          </p>
        </div>
      </div>
    `,
  };
}

export async function sendPublicRejectionEmail(
  to: string,
  fullName: string
): Promise<void> {
  const { subject, html } = renderPublicRejectionEmail({ fullName });
  await sendOne("send", {
    from: `"Somto from Ubuntu Bridge Initiative" <noreply@ubuntubridgeinitiatives.org>`,
    to,
    subject,
    html,
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

// ─── PUBLIC-APPLICATION STAGE PROGRESSION EMAILS ─────────
// Used when an admin manually advances / eliminates an applicant from the
// /admin/applicants screen. Unlike sendStageAdvanced (driven by graded room
// scores) these carry no points — the admin's decision is the signal.
// Returns subject + html so callers enqueue into EmailQueueItem.

export function renderStagePassedEmail(opts: {
  fullName: string;
  newStage: number; // 1-10; 10 = finalist
}): { subject: string; html: string } {
  const firstName = opts.fullName.split(" ")[0];
  const finalist = opts.newStage >= 10;
  const label = finalist ? "the Finalist round" : `Stage ${opts.newStage}`;
  return {
    subject: finalist
      ? "You're a UBI Finalist"
      : `You've advanced to Stage ${opts.newStage} — UBI`,
    html: wrap(
      finalist ? `You're a Finalist, ${firstName}` : `Onward to Stage ${opts.newStage}, ${firstName}`,
      `<p>Congratulations — you've cleared the previous stage and advanced to <strong>${label}</strong>. Log in to your dashboard to continue.</p>`,
      publicUrl("/dashboard"),
      "Open dashboard"
    ),
  };
}

export function renderStageEliminatedEmail(opts: {
  fullName: string;
}): { subject: string; html: string } {
  const firstName = opts.fullName.split(" ")[0];
  return {
    subject: "UBI programme — an update on your progress",
    html: wrap(
      `Hi ${firstName},`,
      `<p>After reviewing your progress, we're unable to advance you to the next stage of the UBI programme for this cohort.</p><p>The work you've done so far is still yours — keep your notes and writeups, keep sharpening, and we'd be glad to see you apply again next intake.</p>`
    ),
  };
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
