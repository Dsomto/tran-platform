import { config } from "dotenv";
config();
config({ path: ".env.local" });
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import nodemailer from "nodemailer";

/**
 * Personalised Stage 2 PROBATION letters. These six interns scored below the
 * cutoff but showed real skill; on review they are being let through Stage 2
 * one time, with no resubmission, and told plainly it cannot happen again.
 * DRY RUN by default (writes previews to /tmp/probation/). SEND=1 sends via
 * Resend (RESEND_API_KEY) if set, else SMTP.
 *
 *   npx tsx scripts/stage2-probation-emails.ts          # preview
 *   SEND=1 npx tsx scripts/stage2-probation-emails.ts   # send
 */
const SEND = process.env.SEND === "1";
const FROM = process.env.RESEND_FROM || `"Somto from Ubuntu Bridge Initiative" <noreply@ubuntubridgeinitiatives.org>`;

type Person = { name: string; email: string; score: number; didWell: string; gap: string };

const PEOPLE: Person[] = [
  {
    name: "Nicole Enyonam Agbanyo", email: "nicolibanera@gmail.com", score: 64,
    didWell:
      "Your findings catalogue was one of the strongest I read. You caught almost all of the real vulnerabilities with the evidence to back them, you explained the decoy well, and your report was polished and genuinely actionable.",
    gap:
      "What cost you was a missing finding and, more importantly, impact figures that the evidence did not support. In this work, every number you put on the page has to trace back to what you actually found. Keep it tied to the evidence and you are operating at a pass level comfortably.",
  },
  {
    name: "Maryjudith Chidinma Ogunaka", email: "maryjudithogunaka@gmail.com", score: 52,
    didWell:
      "Your findings catalogue was excellent. You surfaced nine of the ten real vulnerabilities and you quoted the evidence for them, which is exactly the discipline we are looking for.",
    gap:
      "What held you back was the decoy, which you read the wrong way round, and a missing stored XSS finding. Those are small, fixable things for someone clearly working at this level, not a sign you cannot do this.",
  },
  {
    name: "Ayodeji Ogungbire", email: "ayodejiogungbire@gmail.com", score: 52,
    didWell:
      "You found and evidenced a solid set of the real vulnerabilities, and your remediation thinking in the report was sensible and practical.",
    gap:
      "You missed a few findings and read the decoy the wrong way, and your CVSS work used severity labels where we needed full vectors with a short justification. Tighten those and the standard is well within your reach.",
  },
  {
    name: "Orji Ogechukwu Confidence", email: "confidenceogechiorji@gmail.com", score: 48,
    didWell:
      "You caught six of the ten findings with sensible OWASP and CWE mappings, and you got the decoy right, which a lot of people did not.",
    gap:
      "Two habits cost you. Quote the actual vulnerable line as your evidence rather than paraphrasing it, and build the exploit chain all the way through instead of stopping at four hops. Both are method, not ability.",
  },
  {
    name: "Benjamin Opeyemi Abraham", email: "oluwafemibenjamin488@gmail.com", score: 46,
    didWell:
      "You identified seven real vulnerabilities, and you did not fall for the alg:none trap that caught a lot of stronger-looking submissions. That tells me you actually understand what you are looking at.",
    gap:
      "Your findings read as labels rather than proof. Next time, quote the capture line or the exact code that proves each one. That single habit would have moved you well over the line.",
  },
  {
    name: "Adeoye Olude", email: "adeoyeifeoluwa42@gmail.com", score: 37,
    didWell:
      "Your report was one of the better ones I read. You ordered the fixes by the effort they take rather than by raw severity, and you wrote real detection rules with a field and a false-positive rate, which is the part most people skip entirely.",
    gap:
      "What cost you was that your D2, the exploit chain and CVSS, never reached us, so a full third of the marks were simply not there. The skill was clearly present in the rest of your work. Next time, get every deliverable in.",
  },
];

function render(p: Person): { subject: string; html: string } {
  const firstName = p.name.split(" ")[0];
  const subject = "Your Stage 2 result — a second look, and a probation place";
  const html = `
    <div style="font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#F1F5F9;padding:40px 20px;">
      <div style="max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#0F172A 0%,#1E293B 60%,#2563EB 100%);padding:36px 32px;border-radius:18px 18px 0 0;text-align:center;color:white;">
          <div style="display:inline-block;padding:6px 14px;border:1.5px solid rgba(255,255,255,0.3);border-radius:999px;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">Stage 2 &middot; A second look</div>
          <h1 style="margin:0;font-size:23px;font-weight:800;letter-spacing:-0.4px;">You are staying in.</h1>
        </div>
        <div style="background:white;padding:36px 34px;border-radius:0 0 18px 18px;box-shadow:0 4px 12px rgba(15,23,42,0.06);">
          <p style="color:#475569;line-height:1.75;margin:0 0 16px;font-size:15px;">Hi ${firstName},</p>
          <p style="color:#334155;line-height:1.75;margin:0 0 16px;font-size:15px;">I will be straight with you. Your Stage 2 capstone came in below our cutoff, and by the rules that is where the stage ends. I sat with that result, and it did not sit right with me, so I went back and read your work myself.</p>
          <p style="color:#334155;line-height:1.75;margin:0 0 16px;font-size:15px;">${p.didWell}</p>
          <p style="color:#334155;line-height:1.75;margin:0 0 16px;font-size:15px;">${p.gap}</p>
          <div style="margin:22px 0;padding:18px 20px;background:#ECFDF5;border-left:4px solid #10B981;border-radius:10px;">
            <p style="color:#065F46;margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">What we are doing</p>
            <p style="color:#064E3B;margin:0;font-size:14px;line-height:1.7;">We are letting your Stage 2 stand and you continue with the cohort. You do not need to resubmit anything. Consider this a place earned back on the strength of what you actually showed.</p>
          </div>
          <div style="margin:22px 0;padding:18px 20px;background:#FEF9F3;border-left:4px solid #F59E0B;border-radius:10px;">
            <p style="color:#92400E;margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">Hear this clearly</p>
            <p style="color:#78350F;margin:0;font-size:14px;line-height:1.7;">This is a one-time decision, and it will not come again. From here you are held to the same bar as everyone else, with no margin like this. Close the gap I named, bring your full effort to the next stage, and you will be fine. It should not happen again.</p>
          </div>
          <p style="color:#334155;line-height:1.75;margin:18px 0 4px;font-size:15px;">I am glad you are still in the room. Now go and show me I was right to keep you here.</p>
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

async function deliver(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY || process.env.api_key;
  if (key) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    return;
  }
  const t = newTransporter();
  await t.sendMail({ from: FROM, to, subject, html });
  t.close();
}

async function main() {
  mkdirSync("/tmp/probation", { recursive: true });
  console.log(`Mode: ${SEND ? "SEND" : "DRY RUN"}   Sender: ${process.env.RESEND_API_KEY ? "Resend API" : "SMTP"}\n`);
  const sent: string[] = [];
  const failed: string[] = [];
  for (const p of PEOPLE) {
    const { subject, html } = render(p);
    const file = `/tmp/probation/${p.email.replace(/[^a-z0-9]/gi, "_")}.html`;
    writeFileSync(file, html);
    console.log(`${SEND ? "SEND" : "WOULD"} ${p.name} <${p.email}> (was ${p.score})  preview: ${file}`);
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
  console.log(`\n${SEND ? `Sent ${sent.length}, failed ${failed.length}` : `${PEOPLE.length} previews in /tmp/probation/. Set RESEND_API_KEY and re-run with SEND=1.`}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
