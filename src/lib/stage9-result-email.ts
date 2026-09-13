export type Stage9Track = "SOC_ANALYSIS" | "ETHICAL_HACKING" | "GRC" | string;

type Shared = {
  firstName: string;
  track: Stage9Track;
  cohortSize: number;
};

export type Stage9FinalistEmailOptions = Shared & {
  technicalScore: number;
  rank: number;
  trackCohortSize: number;
  cumulativePercentile: number;
  finalistLetterUrl: string;
  referenceLetterUrl: string;
  performanceRecordUrl: string;
  dossierUrl: string;
  feedbackUrl: string;
};

export type Stage9DepartureEmailOptions = Shared & {
  technicalScore: number;
  rank: number;
  trackCohortSize: number;
  cumulativePercentile: number;
  certificateUrl: string;
  addToLinkedInUrl: string;
  personalLetterUrl: string;
  referenceLetterUrl: string;
  performanceRecordUrl: string;
  dossierUrl: string;
  feedbackUrl: string;
  returningCode: string | null;
};

export type Stage9NoSubmissionEmailOptions = Shared;

const TRACK_LABEL: Record<string, string> = {
  SOC_ANALYSIS: "SOC Analysis",
  ETHICAL_HACKING: "Ethical Hacking",
  GRC: "GRC",
};

const TRACK_PLACES: Record<string, number> = {
  SOC_ANALYSIS: 4,
  ETHICAL_HACKING: 3,
  GRC: 3,
};

export function stage9FinalistSubject(firstName: string): string {
  return `You are a Stage 9B Finalist, ${firstName}.`;
}

export function stage9DepartureSubject(firstName: string): string {
  return `Your Stage 9A result and records, ${firstName}.`;
}

export function stage9NoSubmissionSubject(firstName: string): string {
  return `A final note on your Stage 9A record, ${firstName}.`;
}

export function renderStage9FinalistEmail(opts: Stage9FinalistEmailOptions): string {
  const track = trackLabel(opts.track);
  const places = TRACK_PLACES[opts.track] ?? 10;
  return shell("#0F766E", `
    ${kicker("Ubuntu Bridge Initiative · Stage 9B", "#0F766E")}
    <h1 style="font-size:30px;line-height:1.2;color:#0F172A;margin:14px 0 11px;">You are a finalist, ${escapeHtml(opts.firstName)}.</h1>
    <p style="font-size:15px;line-height:1.75;color:#334155;margin:0 0 18px;">Your Stage 9A submission and your complete Advanced Programme history placed you inside the <strong>${places} available ${escapeHtml(track)} places</strong>. You are now one of the ten associates selected for Stage 9B.</p>
    ${resultLedger(opts.technicalScore, opts.rank, opts.trackCohortSize, opts.cumulativePercentile, track)}
    <div style="padding:18px 19px;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:8px;margin:0 0 22px;">
      <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#047857;font-weight:800;margin-bottom:7px;">You may begin now</div>
      <p style="font-size:14px;line-height:1.72;color:#065F46;margin:0;">Choose and begin an original individual project that shows the strongest work you can do in your track. You will present the finished project and defend your technical decisions before the programme panel. The formal scope, evidence rules, deadline and presentation schedule will be sent tomorrow.</p>
    </div>
    <p style="font-size:14px;line-height:1.72;color:#334155;margin:0 0 20px;"><strong>No certificate is issued at this point.</strong> Finalist is your progression status; it does not claim that the final project or the programme has already been completed. Your signed finalist letter records exactly what you have earned.</p>
    ${documentGrid([
      ["Stage 9B finalist letter", "Signed confirmation of your place in the final ten.", opts.finalistLetterUrl, "Open finalist letter"],
      ["Detailed assessor feedback", "The full evidence-by-evidence reasons for your Stage 9A score.", opts.feedbackUrl, "Read feedback"],
      ["Performance record", "Your released scores and cumulative selection basis.", opts.performanceRecordUrl, "Open performance record"],
      ["Portfolio dossier", "A durable account of the advanced projects you completed.", opts.dossierUrl, "Open portfolio dossier"],
      ["Reference letter", "An employer-facing record of the work and standing you earned.", opts.referenceLetterUrl, "Open reference letter"],
    ])}
    <p style="font-size:15px;line-height:1.78;color:#334155;margin:24px 0 0;">Take a breath and let this register. You survived an extraordinarily narrow boundary. Then begin with intention: choose a problem worth solving, define what proof will make the result believable, and build something you will be proud to defend.</p>
  `);
}

export function renderStage9DepartureEmail(opts: Stage9DepartureEmailOptions): string {
  const track = trackLabel(opts.track);
  const places = TRACK_PLACES[opts.track] ?? 10;
  return shell("#1D4ED8", `
    ${kicker("Ubuntu Bridge Initiative · Stage 9A", "#1D4ED8")}
    <h1 style="font-size:29px;line-height:1.22;color:#0F172A;margin:14px 0 11px;">First, take a breath, ${escapeHtml(opts.firstName)}.</h1>
    <p style="font-size:15px;line-height:1.76;color:#334155;margin:0 0 15px;">You reached Stage 9A after surviving eight demanding stages, submitted the ${escapeHtml(track)} final case, and had the work assessed. Your frozen technical submission earned <strong>${opts.technicalScore}/90</strong>. That work is real, and this result does not erase it.</p>
    <p style="font-size:15px;line-height:1.76;color:#334155;margin:0 0 19px;">This was a severe boundary: only ten finalist places across a 34-person room, with ${places} available in your track. Your cumulative position was <strong>${opts.rank} of ${opts.trackCohortSize}</strong>. Strong work missed this boundary. It would be dishonest to describe this as an ordinary pass mark.</p>
    ${resultLedger(opts.technicalScore, opts.rank, opts.trackCohortSize, opts.cumulativePercentile, track)}
    <div style="padding:18px 19px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;margin:0 0 22px;">
      <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#1D4ED8;font-weight:800;margin-bottom:7px;">What you have earned</div>
      <p style="font-size:14px;line-height:1.72;color:#1E3A8A;margin:0;">A signed, verifiable Stage 9A completion-and-assessment certificate; a personal closing letter; your cumulative performance record; portfolio dossier; reference letter; full assessor feedback; and a returning-candidate code where one has been issued.</p>
    </div>
    ${documentGrid([
      ["Stage 9A certificate", "Confirms that your project was completed, submitted and formally assessed.", opts.certificateUrl, "Download certificate"],
      ["Add to LinkedIn", "Add the verified Stage 9A credential to your profile.", opts.addToLinkedInUrl, "Add credential"],
      ["Personal closing letter", "Records your score, track position and the competitiveness of the boundary.", opts.personalLetterUrl, "Open personal letter"],
      ["Detailed assessor feedback", "The evidence-based score reasons and practical next improvements.", opts.feedbackUrl, "Read feedback"],
      ["Performance record", "Your released stage results and selection history.", opts.performanceRecordUrl, "Open performance record"],
      ["Portfolio dossier", "A professional account of your advanced-stage body of work.", opts.dossierUrl, "Open portfolio dossier"],
      ["Reference letter", "An employer-facing record that does not overclaim your outcome.", opts.referenceLetterUrl, "Open reference letter"],
    ])}
    ${opts.returningCode ? returningCode(opts.returningCode) : ""}
    <p style="font-size:15px;line-height:1.8;color:#334155;margin:24px 0 0;">This is the end of your competitive run in Cohort 1, not the end of your relationship with UBI and not a verdict on your future. Keep building, testing, documenting and asking better questions. Very few people can truthfully say they reached this room.</p>
  `);
}

export function renderStage9NoSubmissionEmail(opts: Stage9NoSubmissionEmailOptions): string {
  return shell("#64748B", `
    ${kicker("Ubuntu Bridge Initiative · Stage 9A", "#64748B")}
    <h1 style="font-size:29px;line-height:1.22;color:#0F172A;margin:14px 0 11px;">Your Stage 9A record needs an honest ending, ${escapeHtml(opts.firstName)}.</h1>
    <p style="font-size:15px;line-height:1.76;color:#334155;margin:0 0 18px;">You were one of only ${opts.cohortSize} associates who reached Stage 9A from more than 3,000 applicants. That distance remains true. However, no assessable Stage 9A submission was recorded, so no score, rank, certificate or project record has been invented.</p>
    <div style="padding:18px 19px;background:#F8FAFC;border:1px solid #CBD5E1;border-radius:8px;margin:0 0 21px;">
      <p style="font-size:14px;line-height:1.72;color:#475569;margin:0;">Your earlier earned credentials remain valid. This note records only that Stage 9A could not be assessed and that you will not enter the ten-person Stage 9B finalist group.</p>
    </div>
    <p style="font-size:15px;line-height:1.8;color:#334155;margin:0;">Reaching this far still happened. Carry the discipline, knowledge and proof of work from the stages you completed into whatever you build next.</p>
  `);
}

function resultLedger(score: number, rank: number, cohortSize: number, cumulative: number, track: string): string {
  const rows = [
    ["Specialist track", track],
    ["Stage 9A technical score", `${score}/90`],
    ["Cumulative track position", `${rank} of ${cohortSize}`],
    ["Cumulative weighted percentile", cumulative.toFixed(2)],
    ["Selection basis", "Within-track percentiles weighted across Stages 5-9A"],
  ];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #CBD5E1;margin:0 0 21px;">
    <tr><td colspan="2" style="padding:12px 15px;background:#0F172A;color:#FFF;font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;">Audited result record</td></tr>
    ${rows.map(([label, value], index) => `<tr><td width="43%" style="padding:10px 14px;background:${index % 2 ? "#FFF" : "#F8FAFC"};border-top:1px solid #E2E8F0;color:#64748B;font-size:12px;font-weight:700;">${escapeHtml(label)}</td><td style="padding:10px 14px;background:${index % 2 ? "#FFF" : "#F8FAFC"};border-top:1px solid #E2E8F0;color:#0F172A;font-size:13px;font-weight:800;">${escapeHtml(value)}</td></tr>`).join("")}
  </table>`;
}

function documentGrid(items: Array<[string, string, string, string]>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #D8E0E9;">
    ${items.map(([title, description, url, action], index) => `<tr><td style="padding:15px 16px;background:${index % 2 ? "#F8FAFC" : "#FFF"};border-top:${index ? "1px solid #E2E8F0" : "0"};"><div style="font-size:14px;line-height:1.4;font-weight:800;color:#0F172A;margin-bottom:4px;">${escapeHtml(title)}</div><div style="font-size:12px;line-height:1.55;color:#64748B;margin-bottom:8px;">${escapeHtml(description)}</div><a href="${escapeHtml(url)}" style="font-size:12px;font-weight:800;color:#0F766E;text-decoration:none;">${escapeHtml(action)} &rarr;</a></td></tr>`).join("")}
  </table>`;
}

function returningCode(code: string): string {
  return `<div style="margin-top:21px;padding:17px 18px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;"><div style="font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:#92400E;font-weight:800;margin-bottom:7px;">Returning-candidate code</div><div style="font-family:monospace;font-size:20px;font-weight:800;color:#78350F;">${escapeHtml(code)}</div><p style="font-size:12px;line-height:1.6;color:#92400E;margin:7px 0 0;">Keep this private. It preserves a route back into a future UBI cohort.</p></div>`;
}

function kicker(text: string, color: string): string {
  return `<div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:${color};font-weight:800;">${escapeHtml(text)}</div>`;
}

function shell(accent: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#EEF2F6;font-family:Arial,Helvetica,sans-serif;color:#0F172A;letter-spacing:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:650px;background:#FFF;border:1px solid #D8E0E9;border-top:5px solid ${accent};"><tr><td style="padding:32px 30px 12px;"><div style="font-size:17px;font-weight:900;color:#082F49;">Ubuntu Bridge Initiative</div><div style="font-size:11px;color:#64748B;margin-top:4px;">Cohort 1 · Advanced Programme</div></td></tr><tr><td style="padding:18px 30px 34px;">${body}<p style="font-size:13px;line-height:1.7;color:#64748B;margin:28px 0 0;">With respect,<br><strong style="color:#0F172A;">Somto from UBI</strong><br>Programme Head</p></td></tr></table></td></tr></table></body></html>`;
}

function trackLabel(track: Stage9Track): string {
  return TRACK_LABEL[track] ?? track.replaceAll("_", " ");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}
