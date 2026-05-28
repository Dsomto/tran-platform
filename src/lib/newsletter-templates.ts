// Newsletter templates — designed HTML emails the super admin can pick from
// the Newsletter page (/admin/broadcast). Each template returns a full HTML
// document with inline styles + a small <style> block for subtle animations
// (Apple Mail / webmail clients render them; Outlook degrades gracefully).
//
// Templates bypass the plain-text composer's escapeHtml step — their bodies
// are trusted source code, not user-typed HTML. The only per-recipient
// substitution is `{First name}` (any casing) which is filled before send.
//
// Add a template by appending to NEWSLETTER_TEMPLATES. Each template can
// optionally declare `variables` the admin must fill before sending.

export type TemplateVariable = {
  name: string;
  label: string;
  placeholder: string;
  required: boolean;
  multiline?: boolean;
  /** Pre-filled value when the template is picked. The admin can edit or clear it. */
  defaultValue?: string;
};

export type NewsletterTemplate = {
  id: string;
  name: string;
  description: string;
  defaultSubject: string;
  variables: TemplateVariable[];
  // Renders the full HTML email body. `firstName` is substituted at send time
  // for each recipient; `vars` is filled in by the admin in the composer.
  render: (args: { firstName: string; vars: Record<string, string> }) => string;
};

// ─── Shared building blocks ──────────────────────────────────────────────

const ANIMATIONS_STYLE = `
  <style>
    /* Subtle motion that webmail clients support; Outlook desktop degrades to static. */
    @keyframes ubi-pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); }
      50% { transform: scale(1.025); box-shadow: 0 6px 18px rgba(37, 99, 235, 0.40); }
    }
    @keyframes ubi-shimmer {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes ubi-star-bob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
    .ubi-cta-pulse { animation: ubi-pulse 2.6s ease-in-out infinite; }
    .ubi-gradient-shift { background-size: 200% 200% !important; animation: ubi-shimmer 9s ease infinite; }
    .ubi-star-bob { display: inline-block; animation: ubi-star-bob 2.2s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) {
      .ubi-cta-pulse, .ubi-gradient-shift, .ubi-star-bob { animation: none !important; }
    }
    @media (max-width: 480px) {
      .ubi-hero-title { font-size: 24px !important; }
      .ubi-action-card { padding: 14px !important; }
    }
  </style>
`;

// Branded sponsor block — designed distinct from the rest of the email.
// Gold/amber gradient card with animated star, larger thank-you heading,
// serif fallback for the heading to give it gravitas. Heading + body are
// supplied by the caller so the admin can edit either through template vars.
function sponsorBlock(args: { heading: string; bodyHtml: string }): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 16px;">
      <tr>
        <td style="background-color:#FBBF24;background-image:linear-gradient(135deg,#FCD34D 0%,#FBBF24 50%,#F59E0B 100%);border-radius:14px;padding:0;border:1px solid #D97706;" class="ubi-gradient-shift">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:rgba(255,255,255,0.10);border-radius:14px;">
            <tr>
              <td style="padding:28px 24px 24px;">
                <div style="font-size:11px;letter-spacing:0.20em;text-transform:uppercase;color:#78350F;font-weight:800;margin-bottom:10px;">
                  <span class="ubi-star-bob" aria-hidden="true">⭐</span>
                  &nbsp;&nbsp;Our Sponsor
                </div>
                <h3 style="margin:0 0 14px;font-size:24px;line-height:1.25;color:#451A03;font-weight:800;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">
                  ${args.heading}
                </h3>
                <p style="margin:0;font-size:14.5px;color:#78350F;line-height:1.7;">
                  ${args.bodyHtml}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

// Permits a tiny, fixed whitelist of HTML in admin-supplied text fields:
// <strong>, <em>, <br>. Everything else (script tags, on-attributes, links)
// is stripped/escaped. The sender is super-admin-only behind 2FA per
// email-send-guard, but defence-in-depth keeps the trust boundary tight.
function sanitiseTrustedSpan(input: string): string {
  const escaped = input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/&lt;strong&gt;/gi, "<strong>")
    .replace(/&lt;\/strong&gt;/gi, "</strong>")
    .replace(/&lt;em&gt;/gi, "<em>")
    .replace(/&lt;\/em&gt;/gi, "</em>")
    .replace(/&lt;br\s*\/?&gt;/gi, "<br>")
    .replace(/\n/g, "<br>");
}

function brandedHeader(args: { eyebrow: string; title: string; subtitle: string; bgColors?: string }): string {
  const bg = args.bgColors ?? "linear-gradient(135deg,#2563EB 0%,#0891B2 50%,#06B6D4 100%)";
  return `
    <tr>
      <td style="background-color:#2563EB;background-image:${bg};padding:38px 30px;border-radius:14px 14px 0 0;text-align:center;color:white;" class="ubi-gradient-shift">
        <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;opacity:0.88;margin-bottom:12px;font-weight:600;">
          🛡️&nbsp;&nbsp;${args.eyebrow}
        </div>
        <h1 class="ubi-hero-title" style="margin:0;font-size:30px;font-weight:800;line-height:1.18;color:white;letter-spacing:-0.015em;">${args.title}</h1>
        <p style="margin:12px 0 0;font-size:14px;opacity:0.92;color:white;">${args.subtitle}</p>
      </td>
    </tr>
  `;
}

function footer(): string {
  return `
    <tr>
      <td style="padding:22px 14px 8px;text-align:center;font-size:12px;color:#94A3B8;line-height:1.65;">
        You're receiving this because you're part of the Ubuntu Bridge Initiative cybersecurity internship cohort.<br>
        Questions? Reply to this email or ask in the cohort Slack.<br>
        <span style="color:#CBD5E1;margin-top:6px;display:inline-block;">🛡️ Ubuntu Bridge Initiative · Africa/Lagos</span>
      </td>
    </tr>
  `;
}

function shell(args: { previewText: string; headerHtml: string; bodyHtml: string; title: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${args.title}</title>
  ${ANIMATIONS_STYLE}
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;color:#0F172A;line-height:1.6;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1;color:#F1F5F9;opacity:0;">
    ${args.previewText}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F1F5F9;padding:36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
          ${args.headerHtml}
          ${args.bodyHtml}
          ${footer()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Template 1: Cohort Kickoff ─────────────────────────────────────────

const KICKOFF: NewsletterTemplate = {
  id: "cohort-kickoff",
  name: "Cohort Kickoff",
  description: "Welcome at cohort start. Calendar, login, Slack, sponsor block. All copy is pre-filled — edit any field before sending.",
  defaultSubject: "Cohort 1 starts Saturday — your kickoff pack, {First name}",
  variables: [
    {
      name: "intro",
      label: "Opening paragraph (after 'Hi {First name},')",
      placeholder: "You're in. Welcome to Cohort 1 of the Ubuntu Bridge Initiative cybersecurity internship…",
      required: true,
      multiline: true,
      defaultValue: "You're in. Welcome to Cohort 1 of the Ubuntu Bridge Initiative cybersecurity internship. We kick off this Saturday with the cohort town hall, and Stage 0 opens Monday, June 1 at 09:00 WAT.",
    },
    {
      name: "calendar_blurb",
      label: "Calendar paragraph (above the blue button)",
      placeholder: "Here is the calendar with every milestone…",
      required: true,
      multiline: true,
      defaultValue: "Here is the calendar with every milestone for the next six weeks — town halls, stage opens, submission deadlines, results, and the laptop-winner decision. One click and 21 events drop straight into your phone or laptop:",
    },
    {
      name: "cta_label",
      label: "Calendar button text",
      placeholder: "Add the cohort calendar",
      required: true,
      defaultValue: "Add the cohort calendar",
    },
    {
      name: "key_date_1",
      label: "Key date 1 — left column",
      placeholder: "Saturday 17:00",
      required: true,
      defaultValue: "Saturday 17:00",
    },
    {
      name: "key_date_1_desc",
      label: "Key date 1 — right column",
      placeholder: "Cohort kickoff town hall",
      required: true,
      defaultValue: "Cohort kickoff town hall",
    },
    {
      name: "key_date_2",
      label: "Key date 2 — left column",
      placeholder: "Monday 09:00",
      required: true,
      defaultValue: "Monday 09:00",
    },
    {
      name: "key_date_2_desc",
      label: "Key date 2 — right column",
      placeholder: "Stage 0 opens",
      required: true,
      defaultValue: "Stage 0 opens",
    },
    {
      name: "key_date_3",
      label: "Key date 3 — left column",
      placeholder: "Fri 18:00",
      required: true,
      defaultValue: "Fri 18:00",
    },
    {
      name: "key_date_3_desc",
      label: "Key date 3 — right column",
      placeholder: "Submission deadline (weekly)",
      required: true,
      defaultValue: "Submission deadline (weekly)",
    },
    {
      name: "key_date_4",
      label: "Key date 4 — left column",
      placeholder: "Sun 18:00",
      required: true,
      defaultValue: "Sun 18:00",
    },
    {
      name: "key_date_4_desc",
      label: "Key date 4 — right column",
      placeholder: "Results published (weekly)",
      required: true,
      defaultValue: "Results published (weekly)",
    },
    {
      name: "signoff",
      label: "Closing line (before sign-off)",
      placeholder: "See you Saturday at the town hall.",
      required: true,
      defaultValue: "See you Saturday at the town hall.",
    },
    {
      name: "sponsor_thanks_heading",
      label: "Sponsor block heading",
      placeholder: "Thank you, Peter Ejiofor.",
      required: true,
      defaultValue: "Thank you, Peter Ejiofor.",
    },
    {
      name: "sponsor_body",
      label: "Sponsor block body (one paragraph)",
      placeholder: "This cohort exists because of Peter Ejiofor…",
      required: true,
      multiline: true,
      defaultValue:
        "This cohort exists because of <strong>Peter Ejiofor</strong>. Sponsorship at this scale — fully funded cybersecurity training for hundreds of Nigerians, no strings attached — is rare in Nigeria and rare anywhere in the world. We do not take it for granted, and neither should you. When you finish this programme and someone asks how you got there, his name belongs in that sentence.",
    },
  ],
  render: ({ firstName, vars }) => {
    const v = (k: string) => escapeHtml(vars[k] ?? "");
    // sponsor_body intentionally allows the <strong>…</strong> default through:
    // it's an admin-trusted field. We sanitise only `<` and `>` outside that
    // narrow whitelist.
    const sponsorBodyHtml = sanitiseTrustedSpan(vars.sponsor_body ?? "");

    const body = `
      <tr>
        <td style="background:white;padding:36px 30px 28px;border-radius:0 0 14px 14px;border:1px solid #E2E8F0;border-top:none;">

          <p style="margin:0 0 16px;font-size:15.5px;color:#0F172A;">Hi ${firstName},</p>

          <p style="margin:0 0 18px;font-size:15.5px;color:#1E293B;">${v("intro")}</p>

          <p style="margin:0 0 24px;font-size:15.5px;color:#1E293B;">${v("calendar_blurb")}</p>

          <!-- Calendar CTA -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px;">
            <tr>
              <td align="center">
                <a href="https://ubuntubridgeinitiatives.org/tran-cohort-schedule.ics"
                   class="ubi-cta-pulse"
                   style="display:inline-block;background:#2563EB;color:white;padding:15px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(37,99,235,0.25);">
                  📅&nbsp;&nbsp;${v("cta_label")}
                </a>
              </td>
            </tr>
          </table>

          <!-- Key dates -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:30px;">
            <tr>
              <td style="background:#EFF6FF;border-left:4px solid #2563EB;padding:18px 20px;border-radius:8px;">
                <div style="font-size:11px;font-weight:800;color:#1D4ED8;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:10px;">Key dates · Africa/Lagos (WAT)</div>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:14.5px;color:#1E293B;">
                  <tr><td style="padding:3px 0;">📅 &nbsp;<strong>${v("key_date_1")}</strong></td><td style="padding:3px 0;">${v("key_date_1_desc")}</td></tr>
                  <tr><td style="padding:3px 0;">🚀 &nbsp;<strong>${v("key_date_2")}</strong></td><td style="padding:3px 0;">${v("key_date_2_desc")}</td></tr>
                  <tr><td style="padding:3px 0;">⏰ &nbsp;<strong>${v("key_date_3")}</strong></td><td style="padding:3px 0;">${v("key_date_3_desc")}</td></tr>
                  <tr><td style="padding:3px 0;">🏁 &nbsp;<strong>${v("key_date_4")}</strong></td><td style="padding:3px 0;">${v("key_date_4_desc")}</td></tr>
                </table>
              </td>
            </tr>
          </table>

          <h2 style="margin:0 0 18px;font-size:20px;color:#0F172A;font-weight:800;letter-spacing:-0.01em;">Three things to do today</h2>

          <!-- Action card 1 -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:14px;" class="ubi-action-card">
            <tr>
              <td style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:18px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td width="40" valign="top" style="padding-top:2px;">
                      <div style="background:#2563EB;color:white;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px;font-weight:800;font-size:15px;">1</div>
                    </td>
                    <td valign="top">
                      <div style="font-size:15.5px;font-weight:700;color:#0F172A;margin-bottom:6px;">Add the calendar to your phone or laptop</div>
                      <div style="font-size:14px;color:#334155;line-height:1.65;">
                        Tap the blue button above. Works with Google Calendar, Apple Calendar, Outlook, and Samsung Calendar.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Action card 2 -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:14px;" class="ubi-action-card">
            <tr>
              <td style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:18px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td width="40" valign="top" style="padding-top:2px;">
                      <div style="background:#2563EB;color:white;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px;font-weight:800;font-size:15px;">2</div>
                    </td>
                    <td valign="top">
                      <div style="font-size:15.5px;font-weight:700;color:#0F172A;margin-bottom:6px;">Get into your account</div>
                      <div style="font-size:14px;color:#334155;line-height:1.65;margin-bottom:10px;">
                        Your welcome email with credentials should already be in your inbox (check the spam folder too). If you cannot find it, go straight to the login page and click <strong>"Forgot password"</strong> — a fresh reset link is sent to the email you applied with. No need to write us.
                      </div>
                      <a href="https://ubuntubridgeinitiatives.org/login" style="display:inline-block;color:#2563EB;font-weight:700;font-size:14px;text-decoration:none;border-bottom:2px solid #93C5FD;padding-bottom:1px;">Open the login page →</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Action card 3 -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;" class="ubi-action-card">
            <tr>
              <td style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:18px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td width="40" valign="top" style="padding-top:2px;">
                      <div style="background:#2563EB;color:white;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px;font-weight:800;font-size:15px;">3</div>
                    </td>
                    <td valign="top">
                      <div style="font-size:15.5px;font-weight:700;color:#0F172A;margin-bottom:6px;">Join the cohort Slack</div>
                      <div style="font-size:14px;color:#334155;line-height:1.65;margin-bottom:12px;">
                        Where we run the cohort day-to-day — announcements, peer help, grader office hours.
                      </div>
                      <a href="https://join.slack.com/t/ubuntubridgei-b0a2120/shared_invite/zt-3yovczvzb-aYyq5hkUsa2RYyvRcB3Jsw"
                         style="display:inline-block;background:#4A154B;color:white;padding:11px 20px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
                        💬&nbsp;&nbsp;Join Cohort Slack
                      </a>
                      <div style="font-size:13px;color:#64748B;margin-top:10px;line-height:1.55;">
                        No app? The web version at <a href="https://slack.com" style="color:#2563EB;font-weight:600;text-decoration:none;">slack.com</a> works fine on a PC.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          ${sponsorBlock({ heading: v("sponsor_thanks_heading"), bodyHtml: sponsorBodyHtml })}

          <p style="margin:28px 0 0;font-size:15.5px;color:#0F172A;font-weight:600;">${v("signoff")}</p>
          <p style="margin:18px 0 0;font-size:14px;color:#475569;line-height:1.65;">
            — The UBI team<br>
            <span style="color:#94A3B8;font-size:13px;">Ubuntu Bridge Initiative</span>
          </p>

        </td>
      </tr>
    `;

    return shell({
      title: "Cohort 1 starts Saturday — your kickoff pack",
      previewText: "Town hall Saturday · Stage 0 opens Monday · cohort calendar inside",
      headerHtml: brandedHeader({
        eyebrow: "Ubuntu Bridge Initiative",
        title: "Cohort 1 starts Saturday",
        subtitle: "UBI Cybersecurity Internship",
      }),
      bodyHtml: body,
    });
  },
};

// ─── Template 2: Stage Window Reminder ──────────────────────────────────

const STAGE_REMINDER: NewsletterTemplate = {
  id: "stage-reminder",
  name: "Stage Window Reminder",
  description: "Mid-stage nudge — friendly deadline reminder. Fill in the stage number and a one-line focus message.",
  defaultSubject: "Stage {{stage}} closes Friday — {First name}, here's where to focus",
  variables: [
    { name: "stage", label: "Stage number (0–4)", placeholder: "e.g. 1", required: true },
    { name: "stage_name", label: "Stage short name", placeholder: "e.g. Ciphers & Secrets", required: true },
    { name: "deadline", label: "Submission deadline (free text)", placeholder: "e.g. Friday 14 June 18:00 WAT", required: true },
    { name: "focus", label: "One-line focus / advice for this stage", placeholder: "e.g. Don't skip the capstone — half the points are there.", required: true, multiline: true },
  ],
  render: ({ firstName, vars }) => {
    const body = `
      <tr>
        <td style="background:white;padding:36px 30px 28px;border-radius:0 0 14px 14px;border:1px solid #E2E8F0;border-top:none;">

          <p style="margin:0 0 16px;font-size:15.5px;color:#0F172A;">Hi ${firstName},</p>

          <!-- Stage badge -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;">
            <tr>
              <td style="background:#DBEAFE;color:#1E3A8A;font-size:12px;font-weight:800;padding:6px 12px;border-radius:999px;letter-spacing:0.08em;text-transform:uppercase;">
                Stage ${vars.stage ?? "—"} · ${vars.stage_name ?? ""}
              </td>
            </tr>
          </table>

          <p style="margin:0 0 22px;font-size:16px;color:#1E293B;line-height:1.6;">
            <strong>Stage ${vars.stage ?? "—"} closes ${vars.deadline ?? ""}.</strong>
            <br>Quick check-in before the deadline — here is what we want you focused on for the rest of the window.
          </p>

          <!-- Focus callout -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:26px;">
            <tr>
              <td style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:18px 20px;border-radius:8px;">
                <div style="font-size:11px;font-weight:800;color:#92400E;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:8px;">🎯 &nbsp;Where to focus</div>
                <div style="font-size:15px;color:#78350F;line-height:1.65;">${vars.focus ?? ""}</div>
              </td>
            </tr>
          </table>

          <h2 style="margin:0 0 14px;font-size:18px;color:#0F172A;font-weight:800;">Before Friday</h2>

          <ul style="margin:0 0 24px;padding:0 0 0 22px;font-size:14.5px;color:#334155;line-height:1.8;">
            <li><strong>Read the brief end-to-end.</strong> The board task list is not the report — the capstone is.</li>
            <li><strong>Cite what you read.</strong> Every claim ties to an artefact or an external source.</li>
            <li><strong>Submit early.</strong> Friday 18:00 is the deadline, not the goal. Servers don't grant extensions.</li>
            <li><strong>Stuck? Ask in Slack.</strong> The grader office hours stream is open.</li>
          </ul>

          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px;">
            <tr>
              <td align="center">
                <a href="https://ubuntubridgeinitiatives.org/dashboard"
                   class="ubi-cta-pulse"
                   style="display:inline-block;background:#2563EB;color:white;padding:14px 26px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(37,99,235,0.25);">
                  Open your dashboard →
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 0;font-size:14px;color:#475569;line-height:1.65;">
            — The UBI team<br>
            <span style="color:#94A3B8;font-size:13px;">Ubuntu Bridge Initiative</span>
          </p>

        </td>
      </tr>
    `;

    return shell({
      title: `Stage ${vars.stage ?? ""} closes ${vars.deadline ?? "Friday"}`,
      previewText: `Stage ${vars.stage ?? ""} — ${vars.focus ?? ""}`.slice(0, 140),
      headerHtml: brandedHeader({
        eyebrow: `Stage ${vars.stage ?? ""} · ${vars.stage_name ?? ""}`,
        title: "Submission window closing",
        subtitle: vars.deadline ?? "Friday 18:00 WAT",
        bgColors: "linear-gradient(135deg,#7C3AED 0%,#6366F1 50%,#3B82F6 100%)",
      }),
      bodyHtml: body,
    });
  },
};

// ─── Template 3: Programme Update ───────────────────────────────────────

const PROGRAMME_UPDATE: NewsletterTemplate = {
  id: "programme-update",
  name: "Programme Update",
  description: "General-purpose announcement. Fill in a headline + body. Optional call-to-action button.",
  defaultSubject: "{{headline}} — {First name}",
  variables: [
    { name: "headline", label: "Headline (≤8 words)", placeholder: "e.g. New office hours on Wednesdays", required: true },
    { name: "body", label: "Body — main message (multi-paragraph; one blank line between paragraphs)", placeholder: "Write your message here. Line breaks are kept. One blank line creates a new paragraph.", required: true, multiline: true },
    { name: "cta_text", label: "CTA button text (optional)", placeholder: "e.g. RSVP for office hours", required: false },
    { name: "cta_url", label: "CTA button URL (optional)", placeholder: "https://...", required: false },
  ],
  render: ({ firstName, vars }) => {
    const headline = vars.headline ?? "";
    const bodyText = vars.body ?? "";
    const ctaText = vars.cta_text?.trim() ?? "";
    const ctaUrl = vars.cta_url?.trim() ?? "";

    // Convert plain-text body to paragraphs. Blank line = paragraph break.
    const paragraphs = bodyText
      .split(/\n\s*\n/)
      .map((p) => escapeHtml(p.trim()).replace(/\n/g, "<br>"))
      .filter((p) => p.length > 0)
      .map((p) => `<p style="margin:0 0 16px;font-size:15px;color:#1E293B;line-height:1.7;">${p}</p>`)
      .join("\n");

    const ctaHtml =
      ctaText && ctaUrl && /^https?:\/\//.test(ctaUrl)
        ? `
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:6px 0 26px;">
            <tr>
              <td align="center">
                <a href="${escapeAttr(ctaUrl)}"
                   class="ubi-cta-pulse"
                   style="display:inline-block;background:#2563EB;color:white;padding:14px 26px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(37,99,235,0.25);">
                  ${escapeHtml(ctaText)}&nbsp;&nbsp;→
                </a>
              </td>
            </tr>
          </table>
        `
        : "";

    const body = `
      <tr>
        <td style="background:white;padding:36px 30px 28px;border-radius:0 0 14px 14px;border:1px solid #E2E8F0;border-top:none;">

          <p style="margin:0 0 16px;font-size:15.5px;color:#0F172A;">Hi ${firstName},</p>

          <h2 style="margin:0 0 20px;font-size:22px;color:#0F172A;font-weight:800;line-height:1.3;letter-spacing:-0.01em;">${escapeHtml(headline)}</h2>

          ${paragraphs}

          ${ctaHtml}

          <p style="margin:14px 0 0;font-size:14px;color:#475569;line-height:1.65;">
            — The UBI team<br>
            <span style="color:#94A3B8;font-size:13px;">Ubuntu Bridge Initiative</span>
          </p>

        </td>
      </tr>
    `;

    return shell({
      title: headline || "Programme update",
      previewText: bodyText.slice(0, 140).replace(/\s+/g, " "),
      headerHtml: brandedHeader({
        eyebrow: "Programme update",
        title: headline || "An update from UBI",
        subtitle: "Ubuntu Bridge Initiative",
        bgColors: "linear-gradient(135deg,#0F766E 0%,#0891B2 50%,#0EA5E9 100%)",
      }),
      bodyHtml: body,
    });
  },
};

// ─── Utilities ──────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

// ─── Registry ───────────────────────────────────────────────────────────

export const NEWSLETTER_TEMPLATES: NewsletterTemplate[] = [
  KICKOFF,
  STAGE_REMINDER,
  PROGRAMME_UPDATE,
];

export function getTemplate(id: string): NewsletterTemplate | undefined {
  return NEWSLETTER_TEMPLATES.find((t) => t.id === id);
}

// Renders a template's subject + body with both the admin-supplied variables
// and the per-recipient first name substituted. `{First name}` (any casing)
// in the subject also gets replaced.
export function renderTemplate(args: {
  templateId: string;
  vars: Record<string, string>;
  firstName: string;
}): { subject: string; body: string } | null {
  const tpl = getTemplate(args.templateId);
  if (!tpl) return null;

  const subjectWithVars = substituteVars(tpl.defaultSubject, args.vars);
  const subject = substituteFirstName(subjectWithVars, args.firstName);

  // The body's `{First name}` tokens are inserted via the render function
  // directly (firstName arg), so the template author writes ${firstName} in
  // the JSX-like template. Variables are substituted by the render fn too.
  const body = tpl.render({ firstName: args.firstName, vars: args.vars });

  return { subject, body };
}

function substituteVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const v = vars[key];
    return typeof v === "string" ? v : "";
  });
}

function substituteFirstName(text: string, firstName: string): string {
  return text.replace(/\{\s*first\s*name\s*\}/gi, firstName);
}
