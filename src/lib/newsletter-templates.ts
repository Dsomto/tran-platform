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

// Renders admin-supplied text into safe HTML with a narrow rich-text feature
// set:
//   - `<strong>` and `<em>` and `<br>`  (inline emphasis the default copy uses)
//   - `[label](https://url)`            (markdown-style links, http/https only)
//   - bare `https://url`                (auto-linked)
//   - `\n`                              (line break)
// Everything else is HTML-escaped so script tags, on-attributes, javascript:
// URIs etc. cannot slip through. The sender is super-admin-only behind 2FA per
// email-send-guard, but defence-in-depth keeps the trust boundary tight.
function renderRichText(input: string): string {
  // 1. Escape everything.
  let out = input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Un-escape a tiny whitelist of inline tags.
  out = out
    .replace(/&lt;strong&gt;/gi, "<strong>")
    .replace(/&lt;\/strong&gt;/gi, "</strong>")
    .replace(/&lt;em&gt;/gi, "<em>")
    .replace(/&lt;\/em&gt;/gi, "</em>")
    .replace(/&lt;br\s*\/?&gt;/gi, "<br>");

  // 3. Linkify markdown links AND bare URLs in one pass. Only http(s) is
  // accepted, so javascript: URIs cannot reach an `href`.
  const LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)"'<>]+)\)|(https?:\/\/[^\s)"'<>]+)/g;
  out = out.replace(LINK, (_m, mdText, mdUrl, bareUrl) => {
    if (mdUrl) {
      return `<a href="${mdUrl}" style="color:#2563EB;text-decoration:underline;font-weight:600;" target="_blank" rel="noopener noreferrer">${mdText}</a>`;
    }
    // Bare URL — trim trailing sentence punctuation so a stop / comma after a
    // URL doesn't get swallowed into the link.
    const trail = bareUrl.match(/[.,;:!?]+$/)?.[0] ?? "";
    const url = trail ? bareUrl.slice(0, -trail.length) : bareUrl;
    return `<a href="${url}" style="color:#2563EB;text-decoration:underline;font-weight:600;" target="_blank" rel="noopener noreferrer">${url}</a>${trail}`;
  });

  // 4. Newlines become <br>.
  return out.replace(/\n/g, "<br>");
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
    {
      name: "signature_line_1",
      label: "Sign-off line 1 (your name + greeting)",
      placeholder: "From your friend, Somto.",
      required: true,
      defaultValue: "From your friend, Somto.",
    },
    {
      name: "signature_line_2",
      label: "Sign-off line 2 (your title — appears smaller, lighter)",
      placeholder: "Head of Programs, TRAN",
      required: true,
      defaultValue: "Head of Programs, TRAN",
    },
  ],
  render: ({ firstName, vars }) => {
    // Plain HTML-escape for fields where a link would be confusing (button
    // labels, table cells, headings) — keeps them literal text.
    const v = (k: string) => escapeHtml(vars[k] ?? "");
    // Rich text — permits the inline whitelist + markdown / bare URL links.
    // Use for prose fields (paragraphs, sign-off, sponsor body).
    const rt = (k: string) => renderRichText(vars[k] ?? "");
    const sponsorBodyHtml = renderRichText(vars.sponsor_body ?? "");

    const body = `
      <tr>
        <td style="background:white;padding:36px 30px 28px;border-radius:0 0 14px 14px;border:1px solid #E2E8F0;border-top:none;">

          <p style="margin:0 0 16px;font-size:15.5px;color:#0F172A;">Hi ${firstName},</p>

          <p style="margin:0 0 18px;font-size:15.5px;color:#1E293B;">${rt("intro")}</p>

          <p style="margin:0 0 24px;font-size:15.5px;color:#1E293B;">${rt("calendar_blurb")}</p>

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

          <p style="margin:28px 0 0;font-size:15.5px;color:#0F172A;font-weight:600;">${rt("signoff")}</p>
          <p style="margin:18px 0 0;font-size:14px;color:#475569;line-height:1.65;">
            ${rt("signature_line_1")}<br>
            <span style="color:#94A3B8;font-size:13px;">${rt("signature_line_2")}</span>
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
    { name: "signature_line_1", label: "Sign-off line 1", placeholder: "From your friend, Somto.", required: true, defaultValue: "From your friend, Somto." },
    { name: "signature_line_2", label: "Sign-off line 2 (smaller, lighter)", placeholder: "Head of Programs, TRAN", required: true, defaultValue: "Head of Programs, TRAN" },
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
                <div style="font-size:15px;color:#78350F;line-height:1.65;">${renderRichText(vars.focus ?? "")}</div>
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
            ${renderRichText(vars.signature_line_1 ?? "From your friend, Somto.")}<br>
            <span style="color:#94A3B8;font-size:13px;">${renderRichText(vars.signature_line_2 ?? "Head of Programs, TRAN")}</span>
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
    { name: "signature_line_1", label: "Sign-off line 1", placeholder: "From your friend, Somto.", required: true, defaultValue: "From your friend, Somto." },
    { name: "signature_line_2", label: "Sign-off line 2 (smaller, lighter)", placeholder: "Head of Programs, TRAN", required: true, defaultValue: "Head of Programs, TRAN" },
  ],
  render: ({ firstName, vars }) => {
    const headline = vars.headline ?? "";
    const bodyText = vars.body ?? "";
    const ctaText = vars.cta_text?.trim() ?? "";
    const ctaUrl = vars.cta_url?.trim() ?? "";

    // Convert plain-text body to paragraphs. Blank line = paragraph break.
    // Within each paragraph, markdown links and bare URLs are clickable.
    const paragraphs = bodyText
      .split(/\n\s*\n/)
      .map((p) => renderRichText(p.trim()))
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
            ${renderRichText(vars.signature_line_1 ?? "From your friend, Somto.")}<br>
            <span style="color:#94A3B8;font-size:13px;">${renderRichText(vars.signature_line_2 ?? "Head of Programs, TRAN")}</span>
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

// ─── Shared body helpers for the two cohort-wide broadcasts ─────────────

function paras(texts: string[]): string {
  return texts
    .map((t) => `<p style="margin:0 0 16px;font-size:15px;color:#1E293B;line-height:1.7;">${renderRichText(t)}</p>`)
    .join("\n");
}

function ctaButton(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:6px 0 24px;">
      <tr><td align="center">
        <a href="${escapeAttr(url)}" class="ubi-cta-pulse"
           style="display:inline-block;background:#2563EB;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(37,99,235,0.25);">
          ${escapeHtml(text)}&nbsp;&nbsp;→
        </a>
      </td></tr>
    </table>`;
}

function signoff(line1: string, line2: string): string {
  return `
    <p style="margin:18px 0 0;font-size:14px;color:#475569;line-height:1.65;">
      ${escapeHtml(line1)}<br>
      <span style="color:#94A3B8;font-size:13px;">${escapeHtml(line2)}</span>
    </p>`;
}

// ─── Template 4: Cohort Update + Townhall (Email 1) ─────────────────────

const COHORT_UPDATE_TOWNHALL: NewsletterTemplate = {
  id: "cohort-update-townhall",
  name: "Cohort Update + Townhall (Email 1)",
  description:
    "Warm update to EVERYONE who applied (send to Status = All). Programme progress, an honest note for those who did not continue, and today's townhall invite. Only the townhall time + link are editable.",
  defaultSubject: "Where the Ubuntu Bridge Initiative cohort is now, and an invite for today",
  variables: [
    { name: "townhall_time", label: "Townhall time", placeholder: "Today, 6:00pm WAT", required: false, defaultValue: "Today, 6:00pm WAT" },
    { name: "townhall_link", label: "Townhall link (Google Meet)", placeholder: "https://meet.google.com/...", required: false, defaultValue: "https://meet.google.com/gcx-ndkp-xmz" },
  ],
  render: ({ firstName, vars }) => {
    const when = (vars.townhall_time || "Today, 6:00pm WAT").trim();
    const link = (vars.townhall_link || "https://meet.google.com/gcx-ndkp-xmz").trim();
    const hero = "https://ubuntubridgeinitiatives.org/images/hero-1.jpg";
    return `
<div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#FAFAFA;padding:44px 20px;color:#111111;">
  <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E5E5;border-radius:16px;overflow:hidden;">
    <img src="${hero}" alt="Ubuntu Bridge Initiative cohort" width="600" style="display:block;width:100%;height:200px;object-fit:cover;border:0;" />
    <div style="padding:32px 40px 26px;">
      <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#2563EB;font-weight:700;">Ubuntu Bridge Initiative &nbsp;&middot;&nbsp; Cohort 1</div>
      <h1 style="margin:14px 0 0;font-size:32px;line-height:1.12;font-weight:800;letter-spacing:-0.9px;color:#111111;">The story so far.</h1>
      <div style="width:44px;height:4px;background:#2563EB;border-radius:2px;margin:18px 0 0;"></div>
      <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#737373;">An honest update for everyone who applied, whether you continued with us or not.</p>
    </div>
    <div style="height:1px;background:#F0F0F0;"></div>
    <div style="padding:30px 40px 8px;">
      <p style="margin:0 0 18px;font-size:15px;line-height:1.78;color:#2b2b2b;">Hi ${firstName},</p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.78;color:#2b2b2b;">I'm Somto, and I lead the programme here. A few months ago, more than <strong style="color:#111;">2,800 of you</strong> applied to the first cohort of our cybersecurity internship. You deserve more than a one-line decision, so I want to tell you the real story of what has happened since.</p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.78;color:#2b2b2b;">Just over <strong style="color:#111;">500</strong> were selected to begin, and it is intensive. Every stage narrows the group. <strong style="color:#111;">176</strong> are still standing today, now finishing Stage 4 on governance and risk, and every single stage has been graded by hand, with written feedback, because people deserve to know exactly where they stand and why.</p>
    </div>
    <div style="padding:0 40px;">
      <div style="border:1px solid #BBF7D0;background:#F0FDF4;border-radius:12px;padding:20px 22px;">
        <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#047857;font-weight:800;">This is what it is for</div>
        <p style="margin:8px 0 0;font-size:15px;line-height:1.7;color:#14532D;"><strong>Two of our interns have already been hired</strong> while the programme is still running. That is the whole point, and it is only the beginning.</p>
      </div>
    </div>
    <div style="padding:22px 40px 4px;">
      <p style="margin:0 0 22px;font-size:15px;line-height:1.78;color:#2b2b2b;">Along the way we have been giving people data, so the cost of showing up never gets between them and the work. And next week we are running a selection phase to give out <strong style="color:#111;">two laptops</strong> to the interns who need them most.</p>
      <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#111;font-weight:700;margin:6px 0 8px;">If you did not continue</div>
      <p style="margin:0 0 22px;font-size:14.5px;line-height:1.78;color:#525252;">Hear this clearly: it was competitive, not a verdict on your potential. The next cohort <strong style="color:#111;">will</strong> open, though not immediately. This first one is intensive, and we need a little time to rest and rebuild before we run it again. When applications reopen, I would be glad to see you back.</p>
    </div>
    <div style="padding:6px 40px 0;">
      <div style="border:1px solid #BFDBFE;background:#EFF6FF;border-radius:12px;padding:22px 22px 20px;">
        <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#1E40AF;font-weight:800;">You are invited &nbsp;&middot;&nbsp; Today</div>
        <p style="margin:9px 0 3px;font-size:16px;line-height:1.4;color:#111;font-weight:700;">Finding your place in cybersecurity, and the GRC journey</p>
        <p style="margin:0 0 16px;font-size:14px;color:#1E3A8A;">${escapeHtml(when)} &middot; on Google Meet</p>
        <a href="${escapeAttr(link)}" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;">Join the townhall</a>
      </div>
    </div>
    <div style="padding:22px 40px 4px;">
      <div style="border:1px solid #E5E7EB;background:#F8FAFC;border-radius:12px;padding:20px 22px;">
        <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#475569;font-weight:800;">Made possible by our sponsor</div>
        <p style="margin:8px 0 0;font-size:14px;line-height:1.7;color:#475569;">This programme is sponsored by <strong style="color:#111;">Peter Ejiofor</strong>, Founder and CEO of <strong style="color:#111;">Ethnos Cyber</strong>. His backing is why it stays free for everyone who takes part. We are deeply grateful.</p>
      </div>
    </div>
    <div style="padding:24px 40px 32px;">
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#2b2b2b;">Come with your questions. Thank you for being part of this.</p>
      <p style="margin:0;font-size:15px;color:#111;font-weight:700;">Somto Okoma</p>
      <p style="margin:2px 0 0;font-size:13px;color:#737373;">Head of Programme, Ubuntu Bridge Initiative</p>
    </div>
    <div style="background:#FAFAFA;border-top:1px solid #EEEEEE;padding:18px 40px;text-align:center;">
      <div style="font-size:12px;color:#737373;">Ubuntu &nbsp;&middot;&nbsp; I am because we are.</div>
    </div>
  </div>
</div>`;
  },
};

// ─── Template 5: Scam Bank Launch (Email 2) ─────────────────────────────

const SCAM_BANK: NewsletterTemplate = {
  id: "scam-bank-launch",
  name: "Scam Bank Launch (Email 2)",
  description:
    "Announces the UBI Scam Bank to EVERYONE who applied (send to Status = All). Fully pre-filled, no fields to edit.",
  defaultSubject: "The Ubuntu Bridge Initiative Scam Bank is live",
  variables: [],
  render: ({ firstName }) => {
    const url = "https://scambank.ubuntubridgeinitiatives.org/";
    return `
<div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#FAFAFA;padding:44px 20px;color:#111111;">
  <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E5E5;border-radius:16px;overflow:hidden;">
    <div style="padding:36px 40px 26px;">
      <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#2563EB;font-weight:700;">Ubuntu Bridge Initiative &nbsp;&middot;&nbsp; New platform</div>
      <h1 style="margin:14px 0 0;font-size:32px;line-height:1.12;font-weight:800;letter-spacing:-0.9px;color:#111111;">The Scam Bank is live.</h1>
      <div style="width:44px;height:4px;background:#2563EB;border-radius:2px;margin:18px 0 0;"></div>
      <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#737373;">A community-powered shield against scams. Report one, and you help protect thousands.</p>
    </div>
    <div style="height:1px;background:#F0F0F0;"></div>
    <div style="padding:30px 40px 8px;">
      <p style="margin:0 0 18px;font-size:15px;line-height:1.78;color:#2b2b2b;">Hi ${firstName},</p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.78;color:#2b2b2b;">Today we are launching the <strong style="color:#111;">Ubuntu Bridge Initiative Scam Bank</strong>, a community-powered platform where people anywhere can report the scams they come across, so others can check, learn, and avoid becoming the next victim.</p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.78;color:#2b2b2b;">The idea is simple: <strong style="color:#111;">if one person reports a scam, another person may be saved from it.</strong></p>
    </div>
    <div style="padding:0 40px;">
      <div style="border:1px solid #BFDBFE;background:#EFF6FF;border-radius:12px;padding:22px 22px 8px;">
        <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#1E40AF;font-weight:800;">What you can do</div>
        <p style="margin:12px 0 14px;font-size:14.5px;line-height:1.6;color:#1E3A8A;"><strong style="color:#111;">Report</strong> scam emails, SMS and WhatsApp messages, fake websites, job and investment scams, and phishing links.</p>
        <p style="margin:0 0 14px;font-size:14.5px;line-height:1.6;color:#1E3A8A;"><strong style="color:#111;">Check</strong> whether something has already been reported before you act on it.</p>
        <p style="margin:0 0 14px;font-size:14.5px;line-height:1.6;color:#1E3A8A;"><strong style="color:#111;">Track</strong> the scam patterns spreading in different countries, earn badges, and climb the leaderboard for protecting the community.</p>
      </div>
    </div>
    <div style="padding:24px 40px 6px;">
      <a href="${url}" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:14px;padding:13px 28px;border-radius:10px;">Open the Scam Bank</a>
    </div>
    <div style="padding:14px 40px 4px;">
      <p style="margin:0 0 18px;font-size:15px;line-height:1.78;color:#2b2b2b;">Please share it with your family and friends too, so they can report and check scams alongside you. The more people who use it, the stronger the shield.</p>
    </div>
    <div style="padding:8px 40px 32px;">
      <p style="margin:0;font-size:15px;color:#111;font-weight:700;">The Ubuntu Bridge Initiative team</p>
      <p style="margin:2px 0 0;font-size:13px;color:#737373;">ubuntubridgeinitiatives.org</p>
    </div>
    <div style="background:#FAFAFA;border-top:1px solid #EEEEEE;padding:18px 40px;text-align:center;">
      <div style="font-size:12px;color:#737373;">Ubuntu &nbsp;&middot;&nbsp; I am because we are.</div>
    </div>
  </div>
</div>`;
  },
};

// ─── Template: Stage 4 Result (prank teaser) ────────────────────────────
// Flat UBI brand (not the gradient shell). Builds tension with cryptic copy
// that never states a pass or fail, then reveals the real result lands in an
// hour. Self-contained HTML doc so the approved flat look is preserved.
const STAGE4_PRANK: NewsletterTemplate = {
  id: "stage4-result-prank",
  name: "Stage 4 Result (prank teaser)",
  description:
    "Playful teaser sent to the whole cohort before results. Cryptic tension, no pass/fail, reveals the real result is one hour away. Fully pre-filled.",
  defaultSubject: "Stage 4 Result",
  render: ({ firstName }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stage 4 Result</title>
</head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1;color:#FAFAFA;opacity:0;">Your Stage 4 outcome is ready. Please read this one carefully.</div>
  <div style="background:#FAFAFA;padding:44px 20px;">
    <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E5E5;border-radius:16px;overflow:hidden;">

      <div style="padding:36px 40px 26px;">
        <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#2563EB;font-weight:700;">Ubuntu Bridge Initiative &nbsp;&middot;&nbsp; Cohort 1 &nbsp;&middot;&nbsp; Stage 4</div>
        <h1 style="margin:14px 0 0;font-size:31px;line-height:1.12;font-weight:800;letter-spacing:-0.8px;color:#111111;">Stage 4 Result</h1>
        <div style="width:44px;height:4px;background:#2563EB;border-radius:2px;margin:18px 0 0;"></div>
      </div>

      <div style="height:1px;background:#F0F0F0;"></div>

      <div style="padding:30px 40px 4px;">
        <p style="margin:0 0 18px;font-size:15px;line-height:1.78;color:#2b2b2b;">Hi ${firstName},</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.78;color:#2b2b2b;">It is done. The review closed at 14:07. The number was carried across, rounded the way it is always rounded, and then carried across again. Six deliverables. One of them mattered more than you think, and it was not the one you think.</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.78;color:#2b2b2b;">We checked it twice. Then a third person checked it, quietly, without being asked. The register held. The letter held. The memo did the thing memos do. Somewhere around the roadmap, someone in the room went very still.</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.78;color:#2b2b2b;">Your file sat between two others. To the left, a strong one. To the right, also a strong one. Yours was in the middle, doing exactly what it was always going to do. The envelope has been sealed. The envelope has been unsealed. It is, at time of writing, an envelope.</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.78;color:#2b2b2b;">So here it is. After everything. The moment. Your Stage 4 outcome is&hellip;</p>
      </div>

      <div style="padding:6px 40px 8px;">
        <div style="background:#0F172A;border-radius:14px;padding:30px 26px;text-align:center;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#38BDF8;font-weight:800;">Your official Stage 4 outcome</div>
          <div style="margin:16px 0 8px;font-size:27px;line-height:1.25;font-weight:800;color:#F1F5F9;letter-spacing:-0.4px;">&hellip; not in this email. &#128513;</div>
          <div style="font-size:15px;line-height:1.7;color:#94A3B8;">You read every word of that, didn&rsquo;t you. We know. We wrote it that way.</div>
        </div>
      </div>

      <div style="padding:24px 40px 4px;">
        <p style="margin:0 0 18px;font-size:15px;line-height:1.78;color:#2b2b2b;">Nobody has been passed or failed here, so unclench your shoulders. This was us having a little fun with a cohort that has earned the right to be teased.</p>
        <p style="margin:0 0 6px;font-size:16px;line-height:1.7;color:#111;font-weight:700;">Your real Stage 4 result lands in your inbox in one hour.</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.78;color:#2b2b2b;">Keep this tab open, keep your notifications on, and go get some water. See you in sixty minutes, for real this time.</p>
      </div>

      <div style="padding:14px 40px 32px;">
        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#2b2b2b;">Almost there. Genuinely proud of how far this cohort has pushed.</p>
        <p style="margin:0;font-size:15px;color:#111;font-weight:700;">Somto Okoma</p>
        <p style="margin:2px 0 0;font-size:13px;color:#737373;">Head of Programme, Ubuntu Bridge Initiative</p>
      </div>

      <div style="background:#FAFAFA;border-top:1px solid #EEEEEE;padding:18px 40px;text-align:center;">
        <div style="font-size:12px;color:#737373;">Ubuntu &nbsp;&middot;&nbsp; I am because we are.</div>
      </div>

    </div>
  </div>
</body>
</html>`,
  variables: [],
};

// ─── Registry ───────────────────────────────────────────────────────────

export const NEWSLETTER_TEMPLATES: NewsletterTemplate[] = [
  STAGE4_PRANK,
  COHORT_UPDATE_TOWNHALL,
  SCAM_BANK,
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
//
// `adminSubject` lets the API route pass through what the super admin typed
// (or kept as default) instead of always re-deriving from tpl.defaultSubject —
// otherwise `{{var}}` tokens in an admin-kept subject never resolve.
export function renderTemplate(args: {
  templateId: string;
  vars: Record<string, string>;
  firstName: string;
  adminSubject?: string;
}): { subject: string; body: string } | null {
  const tpl = getTemplate(args.templateId);
  if (!tpl) return null;

  const sourceSubject = args.adminSubject ?? tpl.defaultSubject;
  const subjectWithVars = substituteVars(sourceSubject, args.vars);
  const subject = substituteFirstName(subjectWithVars, args.firstName);

  // Templates interpolate `firstName` directly into HTML (`Hi ${firstName},`).
  // Escape it once here so a stray `<` in an applicant's full name cannot reach
  // the rendered email as live markup. Defence in depth — the application form
  // should already sanitise, but this is the last gate before SMTP.
  const safeFirstName = escapeHtml(args.firstName);
  const body = tpl.render({ firstName: safeFirstName, vars: args.vars });

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
