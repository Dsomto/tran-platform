import { config } from "dotenv";
config();
config({ path: ".env.local" });
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import nodemailer from "nodemailer";

/**
 * Personalised "we could not open your Stage 2 capstone" emails to the
 * cannot-assess interns. Three categories, each with a per-person specifics
 * line. DRY RUN by default (writes HTML previews to /tmp/ca-emails/ and prints
 * the plan). SEND=1 actually sends via the same SMTP creds as src/lib/email.ts.
 *
 *   npx tsx scripts/stage2-resubmit-emails.ts          # preview only
 *   SEND=1 npx tsx scripts/stage2-resubmit-emails.ts   # actually send
 */
const SEND = process.env.SEND === "1";
const DEADLINE = process.env.DEADLINE ?? "Tuesday 24 June 2026";
const FROM = `"Somto from Ubuntu Bridge Initiative" <noreply@ubuntubridgeinitiatives.org>`;

// email -> { category, specifics } ; specifics is one sentence naming exactly
// what was wrong for this person.
const PERMISSION = "permission";
const MISSING = "missing";
const REORG = "reorg";

const PLAN: Record<string, { cat: string; specifics: string }> = {
  "iddyfaridi@gmail.com": {
    cat: PERMISSION,
    specifics:
      "Your capstone was submitted as a OneDrive folder link, and that link does not open for us, it only shows the OneDrive sign-in page with none of your files. We could not reach D1, D2, D3, or D4.",
  },
  "mkhustergqagqa@gmail.com": {
    cat: PERMISSION,
    specifics:
      "Your capstone was submitted as a OneDrive folder link, and that link is blocked for us, it shows no files at all. We could not reach D1, D2, D3, or D4.",
  },
  "matthewsolomon165@gmail.com": {
    cat: PERMISSION,
    specifics:
      "Your Google Drive folder link asks us to sign in and shows no files, so the sharing is not set to public. We could not open D1, D2, D3, or D4.",
  },
  "katlegosekonya52@gmail.com": {
    cat: PERMISSION,
    specifics:
      "Your Google Drive folder link is login-gated and shows no files, so the sharing is not set to public. We could not open D1, D2, D3, or D4.",
  },
  "anamalisolomon@gmail.com": {
    cat: PERMISSION,
    specifics:
      "Your Google Drive folder lists all four files (D1, D2, D3, D4) but none of them will open for us, they appear to be uploaded in a format we cannot read and the sharing asks us to sign in. We could not read any of the four.",
  },
  "estherpaulokon2006@gmail.com": {
    cat: MISSING,
    specifics:
      "Your D1, D2, and D3 came through and read perfectly. The problem is only D4, the ethics stance: that one file (D4.docx) will not open for us by any route, so we could not mark the ethics section.",
  },
  "adeyemisodik670@gmail.com": {
    cat: MISSING,
    specifics:
      "The link you submitted opens a single PDF that contains only D4, the ethics stance. D1 (findings), D2 (exploit chain and CVSS) and D3 (the report) are not at that link, so three of the four deliverables are missing.",
  },
  "adeoyeifeoluwa42@gmail.com": {
    cat: MISSING,
    specifics:
      "Your Drive folder has D1, D3, and D4, but D2, the exploit chain with CVSS and business impact, is not in the folder.",
  },
  "enyijerry67@gmail.com": {
    cat: MISSING,
    specifics:
      "Your Drive folder has D1, D3, and D4, but D2, the exploit chain with CVSS and business impact, is not in the folder.",
  },
  "ibrahimade.sulaiman@gmail.com": {
    cat: MISSING,
    specifics:
      "Your Drive folder has D1, the findings catalogue, but D2, D3, and D4 are not in the folder, so only one of the four deliverables is present.",
  },
  "alayomichaeladetola@gmail.com": {
    cat: REORG,
    specifics:
      "You submitted one Google Doc, and inside it we only see the four labels D1, D2, D3, and D4 with no actual work written under them. So while the headings are there, the findings, exploit chain, report, and ethics content are all empty on our side.",
  },
};

function intro(cat: string): string {
  if (cat === PERMISSION)
    return `It looks like your work may well be finished, the issue is that we simply cannot open the link you submitted, so we were not able to read and mark it. We did not want to score you on something we never actually saw, so we are holding your capstone aside rather than marking it down.`;
  if (cat === REORG)
    return `We were not able to mark your capstone because the document you submitted did not carry your actual work where we could read it. We did not want to score you on something that came through empty on our side, so we are holding your capstone aside rather than marking it down.`;
  return `We were not able to fully mark your capstone because part of it did not reach us. We did not want to penalise you for work you may well have done, so we are holding your capstone aside rather than marking it down.`;
}

function fixSteps(cat: string): string {
  if (cat === PERMISSION)
    return `
      <ol style="color:#334155;margin:0;padding-left:20px;font-size:14px;line-height:1.8;">
        <li>Put all four deliverables in a single <strong>Google Drive</strong> folder. If you used OneDrive, please move them to Google Drive, we cannot read OneDrive links.</li>
        <li>Set the folder sharing to <strong>Anyone with the link &middot; Viewer</strong>, then open the link yourself in a private browser window to confirm it opens with no sign-in.</li>
        <li>Save each deliverable as a <strong>PDF</strong> or a normal Google Doc, named clearly: D1 Findings, D2 Exploit Chain, D3 Report, D4 Ethics.</li>
        <li>Reply to this email with the new link.</li>
      </ol>`;
  if (cat === REORG)
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

function render(name: string, cat: string, specifics: string): { subject: string; html: string } {
  const firstName = name.split(" ")[0];
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
          <p style="color:#334155;line-height:1.75;margin:0 0 16px;font-size:15px;">${intro(cat)}</p>
          <div style="margin:22px 0;padding:18px 20px;background:#FEF9F3;border-left:4px solid #F59E0B;border-radius:10px;">
            <p style="color:#92400E;margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">What we found</p>
            <p style="color:#78350F;margin:0;font-size:14px;line-height:1.7;">${specifics}</p>
          </div>
          <p style="color:#0F172A;margin:24px 0 10px;font-size:15px;font-weight:700;">How to fix it</p>
          ${fixSteps(cat)}
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

function newTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new Error("SMTP env not configured");
  return nodemailer.createTransport({ host, port, secure: false, auth: { user, pass } });
}

// Send via Resend HTTP API when RESEND_API_KEY is set; else fall back to SMTP.
async function deliver(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.RESEND_FROM || FROM, to, subject, html }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    return;
  }
  const t = newTransporter();
  await t.sendMail({ from: FROM, to, subject, html });
  t.close();
}

async function main() {
  const people: Array<{ name: string; email: string }> = JSON.parse(readFileSync("/tmp/s2-ca.json", "utf8"));
  mkdirSync("/tmp/ca-emails", { recursive: true });

  console.log(`Mode: ${SEND ? "SEND" : "DRY RUN"}   Deadline: ${DEADLINE}\n`);
  const sent: string[] = [];
  const failed: string[] = [];
  for (const p of people) {
    const plan = PLAN[p.email.toLowerCase()];
    if (!plan) { console.log(`NO PLAN for ${p.email} — skipped`); continue; }
    if (plan.cat === MISSING) { console.log(`SKIP (partial work -> grade & push, not email) ${p.name}`); continue; }
    const { subject, html } = render(p.name, plan.cat, plan.specifics);
    const file = `/tmp/ca-emails/${p.email.replace(/[^a-z0-9]/gi, "_")}.html`;
    writeFileSync(file, html);
    console.log(`${SEND ? "SEND" : "WOULD"} [${plan.cat}] ${p.name} <${p.email}>  preview: ${file}`);
    if (!SEND) continue;
    try {
      await deliver(p.email, subject, html);
      sent.push(p.email);
      await new Promise((r) => setTimeout(r, 1200));
    } catch (e) {
      console.error(`  FAILED ${p.email}:`, e instanceof Error ? e.message : e);
      failed.push(p.email);
    }
  }
  console.log(`\n${SEND ? `Sent ${sent.length}, failed ${failed.length}` : `${people.length} previews written to /tmp/ca-emails/. Re-run with SEND=1 to send.`}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
