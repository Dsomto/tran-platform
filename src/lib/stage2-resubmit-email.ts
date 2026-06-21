// Stage 2 "we could not open your capstone, please re-share" email.
// Three templates: a capstone we could not open at all (permission), a
// submission whose content came through empty (reorg), and a folder missing
// some deliverables (missing). The per-person "what we found" line is passed
// in as `specifics` so no recipient data lives in the repo.

export type ResubmitTemplate = "permission" | "reorg" | "missing";

function intro(t: ResubmitTemplate): string {
  if (t === "permission")
    return `It looks like your work may well be finished, the issue is that we simply cannot open the link you submitted, so we were not able to read and mark it. We did not want to score you on something we never actually saw, so we are holding your capstone aside rather than marking it down.`;
  if (t === "reorg")
    return `We were not able to mark your capstone because the document you submitted did not carry your actual work where we could read it. We did not want to score you on something that came through empty on our side, so we are holding your capstone aside rather than marking it down.`;
  return `We were not able to fully mark your capstone because part of it did not reach us. We did not want to penalise you for work you may well have done, so we are holding your capstone aside rather than marking it down.`;
}

function fixSteps(t: ResubmitTemplate): string {
  if (t === "permission")
    return `
      <ol style="color:#334155;margin:0;padding-left:20px;font-size:14px;line-height:1.8;">
        <li>Put all four deliverables in a single <strong>Google Drive</strong> folder. If you used OneDrive, please move them to Google Drive, we cannot read OneDrive links.</li>
        <li>Set the folder sharing to <strong>Anyone with the link &middot; Viewer</strong>, then open the link yourself in a private browser window to confirm it opens with no sign-in.</li>
        <li>Save each deliverable as a <strong>PDF</strong> or a normal Google Doc, named clearly: D1 Findings, D2 Exploit Chain, D3 Report, D4 Ethics.</li>
        <li>Reply to this email with the new link.</li>
      </ol>`;
  if (t === "reorg")
    return `
      <ol style="color:#334155;margin:0;padding-left:20px;font-size:14px;line-height:1.8;">
        <li>Make sure your actual work is written into the document, the findings, the exploit chain with CVSS, the report, and the ethics stance, not just the D1 to D4 headings.</li>
        <li>The cleanest way is <strong>four separate files</strong> in one Google Drive folder, named D1 Findings, D2 Exploit Chain, D3 Report, D4 Ethics, each saved as a PDF or Google Doc.</li>
        <li>Set the sharing to <strong>Anyone with the link &middot; Viewer</strong> and open it yourself in a private browser window to confirm it works.</li>
        <li>Reply to this email with the new link.</li>
      </ol>`;
  return `
      <ol style="color:#334155;margin:0;padding-left:20px;font-size:14px;line-height:1.8;">
        <li>Add the missing deliverable(s) to the same Google Drive folder, named clearly (D1 Findings, D2 Exploit Chain, D3 Report, D4 Ethics), each as a PDF or Google Doc.</li>
        <li>Set the folder sharing to <strong>Anyone with the link &middot; Viewer</strong> and open the link yourself in a private browser window to confirm all four open with no sign-in.</li>
        <li>Reply to this email with the link once everything is in place.</li>
      </ol>`;
}

export function renderResubmitEmail(opts: {
  name: string;
  template: ResubmitTemplate;
  specifics: string;
}): { subject: string; html: string } {
  const firstName = (opts.name || "there").split(" ")[0];
  const subject = "Your Stage 2 capstone — we could not open it, quick fix needed";
  const html = `
    <div style="font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#F1F5F9;padding:40px 20px;">
      <div style="max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#0F172A 0%,#1E293B 60%,#2563EB 100%);padding:36px 32px;border-radius:18px 18px 0 0;text-align:center;color:white;">
          <div style="display:inline-block;padding:6px 14px;border:1.5px solid rgba(255,255,255,0.3);border-radius:999px;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">Stage 2 &middot; Capstone</div>
          <h1 style="margin:0;font-size:23px;font-weight:800;letter-spacing:-0.4px;">A quick fix on your submission</h1>
        </div>
        <div style="background:white;padding:36px 34px;border-radius:0 0 18px 18px;box-shadow:0 4px 12px rgba(15,23,42,0.06);">
          <p style="color:#475569;line-height:1.75;margin:0 0 16px;font-size:15px;">Hi ${firstName},</p>
          <p style="color:#334155;line-height:1.75;margin:0 0 16px;font-size:15px;">We have been grading the Stage 2 capstones, and I wanted to reach you directly because yours is one I could not mark yet, and I did not want that to quietly cost you your place.</p>
          <p style="color:#334155;line-height:1.75;margin:0 0 16px;font-size:15px;">${intro(opts.template)}</p>
          <div style="margin:22px 0;padding:18px 20px;background:#FEF9F3;border-left:4px solid #F59E0B;border-radius:10px;">
            <p style="color:#92400E;margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">What we found</p>
            <p style="color:#78350F;margin:0;font-size:14px;line-height:1.7;">${opts.specifics}</p>
          </div>
          <p style="color:#0F172A;margin:24px 0 10px;font-size:15px;font-weight:700;">How to fix it</p>
          ${fixSteps(opts.template)}
          <div style="margin:24px 0;padding:16px 20px;background:#EFF6FF;border-left:4px solid #2563EB;border-radius:10px;">
            <p style="color:#1E3A8A;margin:0;font-size:14px;line-height:1.7;">Please get the corrected link back to us <strong>as soon as you can, ideally within the next few days</strong>, so we can mark it before promotion decisions are finalised. As soon as it reads, we will grade it in full and your score will count exactly like everyone else's.</p>
          </div>
          <p style="color:#334155;line-height:1.75;margin:18px 0 4px;font-size:15px;">If anything here is unclear, just reply and I will help you get it sorted.</p>
          <p style="color:#0F172A;line-height:1.5;margin:18px 0 0;font-size:15px;font-weight:600;">Somto Okoma</p>
          <p style="color:#64748B;line-height:1.5;margin:0;font-size:13px;">Head of Programme, Ubuntu Bridge Initiative</p>
        </div>
        <p style="text-align:center;color:#94A3B8;font-size:11px;margin:24px 0 0;letter-spacing:0.3px;">Ubuntu Bridge Initiative &middot; Building the next generation of cybersecurity professionals</p>
      </div>
    </div>`;
  return { subject, html };
}
