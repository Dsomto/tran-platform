export type Stage7Track = "SOC_ANALYSIS" | "ETHICAL_HACKING" | "GRC" | string;

export type Stage7SelectionProof = {
  label: string;
  rank: number | null;
  cohortSize: number | null;
  percentile: number | null;
  cumulativePercentile: number | null;
};

type SharedResultOptions = {
  firstName: string;
  track: Stage7Track;
  cohortReached: number;
  advancingCount: number;
};

export type Stage7AdvancementEmailOptions = SharedResultOptions & {
  score: number;
  selection: Stage7SelectionProof;
  stage8OpensAt: Date;
  stage8ClosesAt: Date;
  certificateUrl: string | null;
  achievementLetterUrl: string | null;
  referenceLetterUrl: string | null;
  dossierUrl: string | null;
  feedbackUrl: string;
};

export type Stage7DepartureEmailOptions = SharedResultOptions & {
  score: number;
  selection: Stage7SelectionProof;
  effectiveDate: Date | null;
  discontinuationLetterUrl: string | null;
  referenceLetterUrl: string | null;
  performanceRecordUrl: string | null;
  dossierUrl: string | null;
  feedbackUrl: string;
  returningCode: string | null;
};

export type Stage7NoSubmissionEmailOptions = SharedResultOptions & {
  returningCode: string | null;
};

export function stage7ResultSubject(
  outcome: "ADVANCE" | "DEPART" | "NO_SUBMISSION",
  advancingCount = 66
): string {
  if (outcome === "ADVANCE") {
    const remaining = advancingCount < 70 ? "fewer than 70 associates remaining" : `${advancingCount} associates remaining`;
    return `Take a breath. You are now one of ${remaining}.`;
  }
  if (outcome === "DEPART") {
    return "Before you read your Stage 7 result, take a breath.";
  }
  return "A personal note about your Stage 7 record";
}

export function renderStage7AdvancementEmail(opts: Stage7AdvancementEmailOptions): string {
  const selection = selectionRows(opts.selection, opts.score, opts.track);
  const opening = watLabel(opts.stage8OpensAt);
  const deadline = watLabel(opts.stage8ClosesAt);

  return resultShell({
    accent: "#16A34A",
    cohortReached: opts.cohortReached,
    advancingCount: opts.advancingCount,
    headline: "Before anything else, take a breath.",
    intro: `Hi ${escapeHtml(opts.firstName)}. Let your shoulders drop for a second. You began this journey among more than 3,000 applicants and reached a Stage 7 room containing only ${opts.cohortReached} people. Whatever appears in the next section, stop long enough to understand what that already says about you.`,
    body: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 26px;background:#064E3B;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:24px 24px 22px;">
          <div style="font-size:10px;line-height:1.4;font-weight:900;letter-spacing:0.16em;text-transform:uppercase;color:#86EFAC;margin:0 0 8px;">Now, your result</div>
          <div style="font-size:27px;line-height:1.25;font-weight:850;color:#FFFFFF;margin:0 0 9px;">You are moving to Stage 8.</div>
          <p style="font-size:14px;line-height:1.7;color:#D1FAE5;margin:0;">Less than 70 associates remain in active assessment. You are one of them. Sit with that for a moment before thinking about the next task.</p>
        </td></tr>
      </table>

      <p style="font-size:15px;line-height:1.78;color:#334155;margin:0 0 22px;">Your work was read, scored, quality-checked, and ranked inside your specialist track. This was not a fixed pass-mark decision: you finished inside the published Stage 7 percentile boundary.</p>
      ${proofLedger(selection)}

      <h2 style="font-size:18px;line-height:1.35;color:#0F172A;margin:28px 0 10px;">The record you earned</h2>
      <p style="font-size:14px;line-height:1.75;color:#475569;margin:0 0 16px;">
        These are not decorative attachments. Together they prove the stage you completed, the technical work assessed, and the standing produced by the final review. Keep local copies.
      </p>
      ${documentGrid([
        ["Stage 7 certificate", "A signed, verifiable record that you cleared this stage.", opts.certificateUrl, "Open certificate"],
        ["Achievement letter", "The programme office's formal confirmation of your Stage 7 result.", opts.achievementLetterUrl, "Open achievement letter"],
        ["Reference letter", "Written for a hiring manager and safe to forward as issued.", opts.referenceLetterUrl, "Open reference letter"],
        ["Portfolio dossier", "A technical account of the projects and evidence you built across the programme.", opts.dossierUrl, "Open portfolio dossier"],
      ])}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:28px 0 22px;background:#0F172A;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="padding:22px 22px 20px;">
            <div style="font-size:11px;line-height:1.4;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#86EFAC;margin:0 0 12px;">Stage 8 / confirmed live window</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td width="50%" valign="top" style="padding:0 16px 0 0;border-right:1px solid #334155;">
                  <div style="font-size:11px;color:#94A3B8;text-transform:uppercase;font-weight:700;margin-bottom:5px;">Opens</div>
                  <div style="font-size:16px;line-height:1.45;color:#FFFFFF;font-weight:800;">${opening}</div>
                </td>
                <td width="50%" valign="top" style="padding:0 0 0 16px;">
                  <div style="font-size:11px;color:#94A3B8;text-transform:uppercase;font-weight:700;margin-bottom:5px;">Closes</div>
                  <div style="font-size:16px;line-height:1.45;color:#FFFFFF;font-weight:800;">${deadline}</div>
                </td>
              </tr>
            </table>
            <p style="font-size:13px;line-height:1.65;color:#CBD5E1;margin:16px 0 0;">Your Stage 8 room remains time-locked until the opening time. The deadline shown here is Tuesday 25 August, not Friday.</p>
          </td>
        </tr>
      </table>

      <p style="font-size:14px;line-height:1.75;color:#334155;margin:0 0 16px;">
        Celebrate this properly, then read the assessor's criticism. Advancing does not make those notes disappear; it makes them the first instructions for your Stage 8 build.
      </p>
      ${primaryButton(opts.feedbackUrl, "Read the full assessor feedback", "#166534")}
    `,
  });
}

export function renderStage7DepartureEmail(opts: Stage7DepartureEmailOptions): string {
  const selection = selectionRows(opts.selection, opts.score, opts.track);
  const effective = opts.effectiveDate ? watLabel(opts.effectiveDate) : "Two days after results are released";

  return resultShell({
    accent: "#B45309",
    cohortReached: opts.cohortReached,
    advancingCount: opts.advancingCount,
    headline: "Before anything else, take a breath.",
    intro: `Hi ${escapeHtml(opts.firstName)}. Please do not rush to the next paragraph. Put the phone down for a moment if you need to. You began among more than 3,000 applicants and became one of only ${opts.cohortReached} people who reached Stage 7. No result further down this email can take that achievement away from you.`,
    body: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 24px;background:#7C2D12;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:24px 24px 22px;">
          <div style="font-size:10px;line-height:1.4;font-weight:900;letter-spacing:0.16em;text-transform:uppercase;color:#FED7AA;margin:0 0 8px;">Now, your result</div>
          <div style="font-size:25px;line-height:1.3;font-weight:850;color:#FFFFFF;margin:0 0 9px;">You will not move to Stage 8 in this cohort.</div>
          <p style="font-size:14px;line-height:1.72;color:#FFEDD5;margin:0;">I know that sentence may hurt. Take another breath. It is a competitive boundary decision about one stage, not a declaration about your intelligence, effort, or future.</p>
        </td></tr>
      </table>

      <p style="font-size:15px;line-height:1.78;color:#334155;margin:0 0 20px;">Your submission was read, scored, quality-checked, and ranked inside your specialist track. I will not reduce the time you gave this programme to an automated rejection line. The record below explains the decision, and the documents beneath it preserve the work you actually did.</p>

      ${proofLedger(selection)}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:24px 0;background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:18px 20px;">
          <div style="font-size:11px;line-height:1.4;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#9A3412;margin:0 0 7px;">How the boundary was applied</div>
          <p style="font-size:14px;line-height:1.7;color:#7C2D12;margin:0;">There was no hidden fixed score and no cross-track comparison. Non-submitters left first; the remaining attrition was completed from the lowest reviewed positions inside each track under the published Stage 7 percentile rule.</p>
        </td></tr>
      </table>

      <h2 style="font-size:18px;line-height:1.35;color:#0F172A;margin:28px 0 10px;">We are returning your work to you properly</h2>
      <p style="font-size:14px;line-height:1.75;color:#475569;margin:0 0 16px;">
        Download these before dashboard access winds down. The reference letter and portfolio dossier are written to stand on their own; neither reduces you to this selection decision.
      </p>
      ${documentGrid([
        ["Full assessor feedback", "The evidence-by-evidence reasons for the score and what to improve next.", opts.feedbackUrl, "Read assessor feedback"],
        ["Portfolio dossier", "A technical narrative of the work you completed across the programme.", opts.dossierUrl, "Open portfolio dossier"],
        ["Reference letter", "An employer-facing account of the qualities and work the programme can attest to.", opts.referenceLetterUrl, "Open reference letter"],
        ["Performance record", "Your durable assessment record, including score and reviewed standing.", opts.performanceRecordUrl, "Open performance record"],
        ["Programme letter", "The formal close-out letter for your Stage 7 journey.", opts.discontinuationLetterUrl, "Open programme letter"],
      ])}

      ${returningVoucher(opts.returningCode)}

      <p style="font-size:13px;line-height:1.7;color:#64748B;margin:22px 0 0;">
        Dashboard access winds down on <strong style="color:#334155;">${effective}</strong>. Download everything you want to keep before then. The PDFs you save remain yours after access closes.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:24px 0 0;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:20px 21px;">
          <div style="font-size:16px;line-height:1.5;font-weight:800;color:#1E3A8A;margin:0 0 7px;">Our relationship does not end here.</div>
          <p style="font-size:14px;line-height:1.72;color:#1E40AF;margin:0;">You remain part of the UBI community. You remain welcome at open town halls, community activities, future opportunities, and the next cohort through your comeback pass. Stage 7 changes your active assessment status; it does not erase your place among us.</p>
        </td></tr>
      </table>
      <p style="font-size:15px;line-height:1.78;color:#334155;margin:22px 0 0;">Take tonight gently. Disappointment is allowed. But do not make a permanent conclusion about yourself while the emotion is still loud. You built under pressure, submitted work that could be examined, and reached a place thousands of applicants did not.</p>
    `,
  });
}

export function renderStage7NoSubmissionEmail(opts: Stage7NoSubmissionEmailOptions): string {
  return resultShell({
    accent: "#475569",
    cohortReached: opts.cohortReached,
    advancingCount: opts.advancingCount,
    headline: "Before anything else, take a breath.",
    intro: `Hi ${escapeHtml(opts.firstName)}. You were one of only ${opts.cohortReached} associates who reached Stage 7 from more than 3,000 applicants. Pause long enough to recognise that distance before reading the record below.`,
    body: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 24px;background:#334155;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:24px 24px 22px;">
          <div style="font-size:10px;line-height:1.4;font-weight:900;letter-spacing:0.16em;text-transform:uppercase;color:#CBD5E1;margin:0 0 8px;">Your Stage 7 record</div>
          <div style="font-size:24px;line-height:1.3;font-weight:850;color:#FFFFFF;margin:0 0 9px;">No assessable submission was recorded.</div>
          <p style="font-size:14px;line-height:1.72;color:#E2E8F0;margin:0;">Because there was no submitted evidence to assess, you will not move into the ${opts.advancingCount}-person Stage 8 group.</p>
        </td></tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 24px;background:#F8FAFC;border:1px solid #CBD5E1;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:18px 20px;">
          <div style="font-size:11px;line-height:1.4;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#475569;margin:0 0 7px;">What is recorded</div>
          <p style="font-size:14px;line-height:1.7;color:#334155;margin:0;">No technical score, rank, or percentile has been invented for you. The record will state <strong>no submission</strong>, not a fabricated zero-score assessment. A Stage 7 certificate is not issued because there was no submitted Stage 7 evidence to certify.</p>
        </td></tr>
      </table>

      <p style="font-size:15px;line-height:1.78;color:#334155;margin:0 0 18px;">
        This is not a lecture. Life happens, plans collapse, and sometimes the work never reaches the upload button. But the honest lesson is still worth keeping: imperfect submitted work can be reviewed, defended, and improved; work that never arrives cannot be credited.
      </p>
      <p style="font-size:15px;line-height:1.78;color:#334155;margin:0 0 24px;">
        Reaching Stage 7 still happened. Your credentials and results from the stages you completed remain part of your record, your place in the UBI community continues, and your returning-candidate code preserves a direct route back when the next cohort opens.
      </p>

      ${returningVoucher(opts.returningCode)}

      <p style="font-size:15px;line-height:1.78;color:#334155;margin:22px 0 0;">
        Thank you for the distance you covered with us. Whatever interrupted this attempt, do not let it decide what you attempt next.
      </p>
    `,
  });
}

function resultShell(opts: {
  accent: string;
  cohortReached: number;
  advancingCount: number;
  headline: string;
  intro: string;
  body: string;
}): string {
  return `<!doctype html>
  <html lang="en">
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#E9EEF3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0F172A;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">A personal Stage 7 result note from Somto and the UBI programme office.</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#E9EEF3;">
        <tr><td align="center" style="padding:28px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;border-collapse:separate;background:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 12px 38px rgba(15,23,42,0.15);">
            <tr><td style="height:6px;background:${opts.accent};font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr><td style="padding:20px 28px 18px;background:#07111F;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td valign="top">
                    <div style="font-size:12px;font-weight:900;letter-spacing:0.08em;color:#FFFFFF;">UBI / ADVANCED PROGRAMME</div>
                    <div style="font-size:11px;color:#94A3B8;margin-top:4px;">A direct note from Somto</div>
                  </td>
                  <td align="right" valign="top"><span style="display:inline-block;border:1px solid #475569;border-radius:4px;padding:5px 8px;font-size:10px;font-weight:800;color:#CBD5E1;">STAGE 7</span></td>
                </tr>
              </table>
            </td></tr>
            <tr><td><img src="https://ubuntubridgeinitiatives.org/images/hero-3.jpg" width="640" alt="Ubuntu Bridge Initiative community" style="display:block;width:100%;height:220px;object-fit:cover;border:0;"></td></tr>
            <tr><td style="padding:31px 30px 8px;">
              <div style="font-size:10px;line-height:1.4;font-weight:900;letter-spacing:0.16em;text-transform:uppercase;color:${opts.accent};margin:0 0 12px;">A moment before the result</div>
              <h1 style="font-size:29px;line-height:1.2;color:#0F172A;margin:0 0 15px;font-weight:850;letter-spacing:0;">${opts.headline}</h1>
              <p style="font-size:15px;line-height:1.78;color:#475569;margin:0 0 22px;">${opts.intro}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 24px;background:#FFF7ED;border-left:4px solid #F59E0B;">
                <tr><td style="padding:17px 18px;"><div style="font-size:16px;line-height:1.62;font-weight:750;color:#7C2D12;">Breathe in slowly. Breathe out. You do not need to understand your whole future in the next thirty seconds.</div></td></tr>
              </table>
              ${milestoneStrip(opts.cohortReached, opts.advancingCount)}
              ${opts.body}
            </td></tr>
            <tr><td style="padding:26px 30px 30px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid #E2E8F0;">
                <tr>
                  <td valign="top" style="padding-top:20px;font-size:13px;line-height:1.6;color:#334155;">
                    <strong style="color:#0F172A;">Somto Okoma</strong><br>Programme Head, Ubuntu Bridge Initiative
                  </td>
                  <td valign="top" align="right" style="padding-top:20px;font-size:13px;line-height:1.6;color:#334155;">
                    <strong style="color:#0F172A;">Quadri Omoloju</strong><br>Founder, The Root Access Network
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
          <p style="font-size:11px;line-height:1.6;color:#64748B;margin:16px 0 0;">An individual result notice from the Ubuntu Bridge Initiative programme office.</p>
        </td></tr>
      </table>
    </body>
  </html>`;
}

function milestoneStrip(cohortReached: number, advancingCount: number): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 28px;">
      <tr>
        <td width="31%" valign="top" style="padding:15px 8px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:7px;text-align:center;">
          <div style="font-size:24px;line-height:1.2;font-weight:900;color:#0F172A;">3,000+</div>
          <div style="font-size:9px;line-height:1.45;font-weight:800;text-transform:uppercase;color:#64748B;margin-top:5px;">Applied</div>
        </td>
        <td width="3.5%" align="center" style="font-size:16px;color:#94A3B8;">›</td>
        <td width="31%" valign="top" style="padding:15px 8px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:7px;text-align:center;">
          <div style="font-size:24px;line-height:1.2;font-weight:900;color:#1D4ED8;">${cohortReached}</div>
          <div style="font-size:9px;line-height:1.45;font-weight:800;text-transform:uppercase;color:#1E40AF;margin-top:5px;">Reached Stage 7</div>
        </td>
        <td width="3.5%" align="center" style="font-size:16px;color:#94A3B8;">›</td>
        <td width="31%" valign="top" style="padding:15px 8px;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:7px;text-align:center;">
          <div style="font-size:24px;line-height:1.2;font-weight:900;color:#047857;">${advancingCount}</div>
          <div style="font-size:9px;line-height:1.45;font-weight:800;text-transform:uppercase;color:#065F46;margin-top:5px;">Move to Stage 8</div>
        </td>
      </tr>
    </table>`;
}

function selectionRows(selection: Stage7SelectionProof, score: number, track: Stage7Track): Array<[string, string]> {
  return [
    ["Specialist track", trackLabel(track)],
    ["Reviewed technical score", `${score}/100`],
    ["Track position", selection.rank === null ? "Not available" : `${selection.rank} of ${selection.cohortSize ?? "-"}`],
    ["Stage percentile", selection.percentile === null ? "Not available" : `${selection.percentile}`],
    ["Selection rule", selection.label],
  ];
}

function proofLedger(rows: Array<[string, string]>): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border:1px solid #CBD5E1;border-radius:8px;overflow:hidden;margin:0 0 20px;">
      <tr><td colspan="2" style="padding:13px 16px;background:#0F172A;color:#FFFFFF;font-size:11px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;">Audited result record</td></tr>
      ${rows.map(([label, value], index) => `<tr>
        <td width="43%" style="padding:12px 16px;background:${index % 2 === 0 ? "#F8FAFC" : "#FFFFFF"};border-top:1px solid #E2E8F0;font-size:12px;line-height:1.5;color:#64748B;font-weight:700;">${escapeHtml(label)}</td>
        <td style="padding:12px 16px;background:${index % 2 === 0 ? "#F8FAFC" : "#FFFFFF"};border-top:1px solid #E2E8F0;font-size:13px;line-height:1.5;color:#0F172A;font-weight:800;">${escapeHtml(value)}</td>
      </tr>`).join("")}
    </table>`;
}

function documentGrid(items: Array<[string, string, string | null, string]>): string {
  const available = items.filter((item) => Boolean(item[2]));
  if (available.length === 0) return "";
  return available.map(([title, description, url, action], index) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 10px;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">
      <tr>
        <td width="48" align="center" valign="middle" style="background:#F1F5F9;border-right:1px solid #E2E8F0;">
          <div style="display:inline-block;width:25px;height:25px;line-height:25px;border-radius:50%;background:#0F172A;color:#FFFFFF;font-size:11px;font-weight:900;text-align:center;">${index + 1}</div>
        </td>
        <td valign="middle" style="padding:15px 16px;">
          <div style="font-size:14px;line-height:1.45;color:#0F172A;font-weight:800;margin-bottom:3px;">${escapeHtml(title)}</div>
          <div style="font-size:12px;line-height:1.6;color:#64748B;">${escapeHtml(description)}</div>
        </td>
        <td width="154" align="right" valign="middle" style="padding:15px 16px;">${primaryButton(url!, action, "#0F172A")}</td>
      </tr>
    </table>`).join("");
}

function returningVoucher(code: string | null): string {
  if (!code) return "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:26px 0 0;background:#064E3B;border-radius:8px;overflow:hidden;">
      <tr><td style="padding:20px 22px;">
        <div style="font-size:11px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;color:#A7F3D0;margin-bottom:6px;">Your comeback pass</div>
        <p style="font-size:13px;line-height:1.65;color:#D1FAE5;margin:0 0 14px;">Apply to the next cohort with the same email address and enter this one-use code. Reaching Stage 7 is part of the record we will recognise.</p>
        <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:22px;line-height:1.3;font-weight:900;letter-spacing:0.12em;color:#FFFFFF;background:#047857;border:1px dashed #6EE7B7;border-radius:6px;padding:12px;text-align:center;">${escapeHtml(code)}</div>
      </td></tr>
    </table>`;
}

function primaryButton(href: string, label: string, background: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:${background};color:#FFFFFF;text-decoration:none;font-size:12px;line-height:1.2;font-weight:800;padding:10px 14px;border-radius:6px;white-space:nowrap;">${escapeHtml(label)}</a>`;
}

function trackLabel(track: Stage7Track): string {
  if (track === "SOC_ANALYSIS") return "SOC Analysis";
  if (track === "ETHICAL_HACKING") return "Ethical Hacking / VAPT";
  if (track === "GRC") return "Governance, Risk and Compliance";
  return track.replaceAll("_", " ");
}

function watLabel(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("weekday")} ${value("day")} ${value("month")} ${value("year")} · ${value("hour")}:${value("minute")} WAT`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
