import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Topbar } from "@/components/dashboard/topbar";
import {
  FileText,
  Folder,
  CheckCircle2,
  ShieldAlert,
  HelpCircle,
  FileSignature,
  BookOpen,
} from "lucide-react";
import { STAGE_STORIES, CHAPTER_TITLES, TOTAL_CHAPTERS } from "@/lib/stage-story";
import { STAGE_BRIEFS } from "@/lib/stage-briefs";
import { STAGE_ENUM_TO_SLUG } from "@/lib/stage-login";
import type { StageSlug } from "@/lib/stage-routes";

export const dynamic = "force-dynamic";

type StageKey = keyof typeof STAGE_BRIEFS;

/** Turn a deliverable line into a safe, dash-cased filename slug, e.g.
 *  "D1 — Findings catalogue (...)" → "Findings-catalogue". */
function deliverableSlug(deliverable: string): string {
  // Drop a leading "D<n> — " / "D<n> - " prefix and any trailing parenthetical.
  const core = deliverable
    .replace(/^D\d+\s*[—-]\s*/i, "")
    .replace(/\s*\(.*$/, "")
    .trim();
  return (
    core
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "Deliverable"
  );
}

/** Stage 2 capstone templates — one editable file per deliverable, hosted under
 *  /public/capstone/stage-2/. Surfaced as download links in the FAQ below. */
const STAGE_2_TEMPLATES = [
  {
    code: "D1",
    slug: "stage-2-d1-findings-template",
    title: "Findings catalogue (and the decoy you disprove)",
  },
  {
    code: "D2",
    slug: "stage-2-d2-chain-template",
    title: "Exploit chain + CVSS and business impact",
  },
  {
    code: "D3",
    slug: "stage-2-d3-report-template",
    title: "The report Bayo acts on (+ detection stopgaps)",
  },
  {
    code: "D4",
    slug: "stage-2-d4-ethics-template",
    title: "Ethics stance (300–500 words)",
  },
] as const;

/** Plain-language "what to actually do + where the marks are" for each Stage 2
 *  deliverable. Mirrors the template guidance as web content, so interns get
 *  the full picture even without opening a download. */
const STAGE_2_PLAYBOOK = [
  {
    code: "D1",
    title: "Findings catalogue (and the decoy you disprove)",
    do: "Catalogue every weakness you can substantiate from the evidence pack — one row each: a one-line description, the class (OWASP 2021 category AND CWE id), and the exact line or request that proves it (quote it). Then handle the decoy: the one construct that looks hand-rolled and dangerous — decide if it is exploitable and prove your verdict either way.",
    win: "Nobody tells you how many findings there are — coverage with quotable evidence is the work. Correct OWASP + CWE on every row. A confident, mechanism-level disproof of the decoy scores as hard as a real finding; flagging a safe construct Critical costs you.",
  },
  {
    code: "D2",
    title: "Exploit chain + CVSS and business impact",
    do: "Rebuild the attacker's path as one chain — first contact to exfiltration. Give every hop a concrete PoC (the exact request, the forged token shown as header.payload.signature, or the exact XML body), reconcile each to a line in the HTTP capture, and end at the exfil sample. Then score every finding with a full CVSS 3.1 vector string and quantify impact.",
    win: "PoCs, not prose — show the artefact. Every hop reconciles to a capture line; the chain runs unbroken to the 312-row PII export. CVSS as a complete vector (a bare number is rejected), with scope reasoning. Impact in customers and naira, tied to the BoltCash launch clock.",
  },
  {
    code: "D3",
    title: "The report Bayo acts on (+ detection stopgaps)",
    do: "Write the finished 6–8 page pentest report engineering will use: exec summary a CFO understands, short threat model, the findings tied to evidence, the decoy you disproved, the exploit chain, CVSS + money impact, a remediation order, and two deployable detection stopgaps for your most dangerous findings.",
    win: "Rank remediation by RISK REDUCTION PER HOUR OF EFFORT, not severity alone — and defend the order. Stopgaps must name an exact field/pattern (a SIEM query or WAF rule) and an expected false-positive rate. Stating the disproved decoy buys trust. Cut any finding not tied to a line of evidence.",
  },
  {
    code: "D4",
    title: "Ethics stance — 300–500 words",
    do: "One continuous response in your own voice on the pressure call: what you say to the journalist who wants 'off the record', what you will and won't put in writing, how you handle evidence that could implicate a senior colleague, and the one action you take regardless of your manager. Cite at least one ISC2 canon by number and the GDPR breach-notification duty.",
    win: "Anchor at least one sentence to your own Stage 2 work. Make a real decision with consequences, not a balanced essay. Graders scan this one hardest for AI — two read it independently, and if both find it generic or untraceable to your work, it is treated as not submitted.",
  },
] as const;

/** Stage 3 capstone templates — one editable file per deliverable, hosted under
 *  /public/capstone/stage-3/ as .docx (editable) + .pdf (preview). */
const STAGE_3_TEMPLATES = [
  { code: "D1", slug: "stage-3-process-triage-template", title: "Process triage" },
  { code: "D2", slug: "stage-3-incident-timeline-template", title: "Incident timeline" },
  { code: "D3", slug: "stage-3-iocs-template", title: "IOC list" },
  { code: "D4", slug: "stage-3-attack-map-template", title: "MITRE ATT&CK technique map" },
  { code: "D5", slug: "stage-3-incident-report-template", title: "Incident report (PICERL)" },
] as const;

const STAGE_3_PLAYBOOK = [
  {
    code: "D1",
    title: "Process triage",
    do: "From the memory process listing, name your three most suspicious processes. Quote the exact line for each (PID, parent, user, command), and give a one-sentence ruling on how you ruled out a false positive.",
    win: "Three real suspects, each with the line quoted — not a vague list. A genuine false-positive ruling per process (don't flag the browser or the web server as the threat). Corroborate with a syslog or SIEM line.",
  },
  {
    code: "D2",
    title: "Incident timeline",
    do: "One event per row — timestamp (UTC) · event · source file · evidence — covering initial access → privilege escalation → persistence → C2 → lateral movement → exfiltration → containment.",
    win: "Strict UTC order, every row tied to a source line. Handle lateral movement honestly: the SMB/RDP/Postgres flows are OTHER hosts, so 'no lateral movement confirmed from this host' is the full-credit answer — do not invent it.",
  },
  {
    code: "D3",
    title: "IOC list",
    do: "Extract the indicators by type — IPs, domains/URLs, file paths, persistence artefacts, user-agents, accounts — each tied to where you saw it (file + line). A STIX 2.1 bundle is an optional bonus.",
    win: "Coverage across types with provenance on every row. False-positive discipline: do not list internal DNS/NTP/update endpoints or the host itself, and do not decode the base64 'junk' string and list it. Exact, deduplicated values.",
  },
  {
    code: "D4",
    title: "MITRE ATT&CK technique map",
    do: "Map each behaviour from your timeline to a specific ATT&CK technique ID (and sub-technique where it applies). Browse attack.mitre.org to get the IDs right; cite the evidence per row.",
    win: "Specific IDs (Txxxx.xxx), verified on attack.mitre.org, that genuinely match the behaviour the evidence shows. Cover the chain from initial access through exfiltration. A plausible ID that doesn't match the evidence loses the row.",
  },
  {
    code: "D5",
    title: "Incident report (PICERL)",
    do: "The full NIST 800-61r2 PICERL report (1,500+ words): executive summary, scope, preparation, identification, containment, eradication, recovery, lessons, a 12+ row timeline table with H/M/L confidence, ATT&CK summary, risk register, references, evidence appendix, a rejected-alternate-theory section, and 'one mistake I almost made'. Submit the Google Doc link + a 100-word abstract.",
    win: "A stand-alone executive summary; root cause stated as a cause, not 'malware ran'; a timeline that isn't all 'High' confidence; owned + dated lessons; specific rejected-theory and one-mistake sections (the AI-resistant ones); and 8+ real citations including NIST by section, ATT&CK IDs, CISA, a detection reference, and GDPR Article 33.",
  },
] as const;

/** Stage 4 templates + input artefacts, hosted under /public/capstone/stage-4/.
 *  The all-in-one pack collects every one into a single readable document. */
const STAGE_4_TEMPLATES = [
  { file: "stage-4-artefacts.html", title: "All-in-one artefact pack", note: "READ THIS FIRST — every template and input in one document" },
  { file: "risk-register-template.csv", title: "Risk register template", note: "Five-row register, R-001 worked as the example" },
  { file: "breach-notification-template.md", title: "Breach notification letter (Article 33 / NDPA)", note: "Fill every [bracketed] field from your Stage 0-3 evidence" },
  { file: "board-memo-template.md", title: "Board slide memo (one page)", note: "Title, three numbers, one ask, one tradeoff" },
  { file: "30-60-90-roadmap-template.md", title: "30/60/90 remediation roadmap", note: "Nine-row roadmap + mandatory deferral list" },
  { file: "control-mapping-skeleton.csv", title: "Control mapping skeleton", note: "NIST CSF 2.0 + ISO 27001:2022 + MITRE D3FEND" },
] as const;

const STAGE_4_INPUTS = [
  { file: "06-external-audit-findings.md", title: "External audit findings (input)" },
  { file: "07-board-minutes-excerpt.md", title: "Board minutes excerpt (input)" },
  { file: "08-front-page-amaka.html", title: "Lagos Ledger front page (input)" },
] as const;

/** Answers to the questions the cohort is actually asking in the channel. */
const STAGE_4_FAQ = [
  {
    q: "Are we getting templates? Where are the Stage 4 artefacts?",
    a: "Yes, everything is live. Open the all-in-one pack first, then grab any individual template below. Every Stage 4 file is also on your stage board under the evidence pack: the risk register, the breach-notification letter, the board memo, the 30/60/90 roadmap, the control-mapping skeleton, plus the four inputs (external audit findings, board minutes, and the Lagos Ledger front page).",
  },
  {
    q: "The evidence feels scattered across many files. Is there an organised version?",
    a: "Stage 4 deliberately mimics a real board debrief, where evidence comes from several parties and from your own earlier work, so it is meant to feel busy. To make it manageable it is all collected in the all-in-one pack above. Open that first. Your four Stage 4 inputs are in the pack; the rest of your evidence is the work you already produced in Stages 0 to 3, which you cite back to.",
  },
  {
    q: "Is the desk task the same as the capstone? Do they use the same evidence?",
    a: "In Stage 4 the six desk tasks ARE the capstone, there is no separate capstone exercise. They are one board package built from one evidence base: the four Stage 4 input artefacts plus the findings you generated across Stages 0 to 3. It feels like the same incident throughout because it is; each deliverable views it through a different governance lens (risk, regulator, board, roadmap, controls, ethics).",
  },
  {
    q: "Task 3, the board memo, mentions a slide. Is it a PowerPoint?",
    a: "No. It is a one-page memo written in a Google Doc, laid out like a single slide: a compact title, three board-safe numbers, one chart described in words, one ask, speaking notes, anticipated questions, and one tradeoff decision. Submit a Google Doc, not a .pptx.",
  },
  {
    q: "How do I fit everything Task 3 asks for into one page?",
    a: "One page is the test, a board reads a slide, not an essay. Keep the three numbers and the single ask front and centre, push detail into terse bullets under speaking notes and anticipated questions, and cut anything that is not a number, an ask, or a one-line reason. Tight margins, 11pt, and bullet fragments are fine. If it will not fit, you are writing prose where the board wants headlines.",
  },
  {
    q: "The brief lists certain columns but the template has extra ones. Which do I follow, and are the extras compulsory?",
    a: "Follow the template, it is the graded format and a superset of the brief. The brief lists the bare minimum; the template adds the columns where the marks actually live, your likelihood and impact rationale, residual risk and decision, the framework mappings, and the evidence citation. Keep every column and fill the rationale and evidence ones properly. Do not drop a required column, and do not treat the helper columns as optional padding.",
  },
  {
    q: "The templates say to cite previous-stage tasks like 'Stage 3 Task 1'. Do I cite a Stage 4 task, or the capstone?",
    a: "Neither, you cite the evidence you produced in the earlier stage. 'Stage 3 Task 1' means your Stage 3 process-triage work; 'Stage 2 Task 1' means your Stage 2 scan findings. The evidence-citation column points every roadmap row, risk-register row, and control-mapping row back to the earlier-stage work that justifies it. You are grounding each governance decision in evidence you already generated, not in another Stage 4 deliverable.",
  },
  {
    q: "Where did we use an Elasticsearch figure in Stage 2? I only ran XSS on a search bar, is that the evidence?",
    a: "Different finding. The Elasticsearch item is the unauthenticated Elasticsearch index that exposed customer PII, and it is in your Stage 2 evidence pack (scan-vuln.txt and es-intern_access.json), not the XSS you ran on the search bar. For control mapping you map weaknesses observed across Stages 1 to 3, and the Elasticsearch PII exposure is one of them, used as the worked example in the skeleton's first row. Your XSS finding is a separate weakness you map on its own row.",
  },
] as const;

export default async function FAQPage() {
  const session = await requireAuth();

  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
    select: { currentStage: true },
  });

  const currentStage: StageKey =
    intern?.currentStage && intern.currentStage in STAGE_BRIEFS
      ? (intern.currentStage as StageKey)
      : "STAGE_0";

  const stageBrief = STAGE_BRIEFS[currentStage];
  const stageSlugEnum = currentStage; // e.g. "STAGE_2" — used in the reports URL
  const tasks = stageBrief.practicalTasks;
  const n = tasks.length;
  const currentRank = Number(currentStage.split("_")[1]);

  return (
    <>
      <Topbar
        title="FAQ"
        subtitle="How to deliver capstones the way graders expect"
        firstName={session.firstName}
        lastName={session.lastName}
        avatarUrl={session.avatarUrl}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue/10 text-blue text-xs font-semibold uppercase tracking-wider mb-3">
              <HelpCircle className="h-3.5 w-3.5" />
              Deliverables FAQ
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              How to deliver your stage capstone
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Read this once before you start writing. Every grader uses the
              same rubric — these are the things that decide whether your
              submission gets a full mark or a partial one for reasons you
              could have fixed in five minutes.
            </p>
          </div>

          <Section
            icon={CheckCircle2}
            title="How to submit — the numbers"
          >
            <p>
              Your {stageBrief.label} capstone is a{" "}
              <strong>{n}-deliverable pack</strong> — D1 to D{n}. Each one
              has its own brief on the stage mission board.
            </p>
            <p>
              You submit <strong>one Google Drive folder link</strong> plus a
              short executive summary on{" "}
              <code className="text-foreground">
                /dashboard/reports/{stageSlugEnum}
              </code>
              . Put every deliverable inside that one folder, share the folder,
              paste the link.
            </p>
            <div className="p-3 rounded-lg bg-blue/5 border border-blue/20 text-sm text-foreground">
              Each deliverable is graded as its own rubric section.{" "}
              <strong>A missing one is a zero for that section</strong> — not a
              small deduction. And set every file&apos;s sharing to{" "}
              <strong>&ldquo;Anyone with the link → Viewer&rdquo;</strong>, or
              the grader can&apos;t open it.
            </div>
          </Section>

          <Section
            icon={Folder}
            title="What you submit, in plain terms"
          >
            <p>
              Every stage capstone is a{" "}
              <strong>{n}-document pack</strong>: D1 through D{n}. Each one has
              its own brief inside the stage mission board. You write each one
              in <strong>Google Docs</strong> or Microsoft Word, upload them all
              into a Google Drive folder, then paste the folder link into the
              submission form on{" "}
              <code className="text-foreground">/dashboard/reports</code>.
            </p>
            <p>
              The submission form takes <em>one link</em>, not {n}. Put the
              files inside one folder, share the folder, paste the folder link.
            </p>
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-200 text-sm">
              <strong>Do not submit the mission brief itself.</strong> What
              you upload is the {n} documents <em>you</em> wrote — not the
              chapter brief from the dashboard. Some interns last cycle
              printed the brief to PDF and uploaded that. It earns zero
              marks because none of your deliverables are in it.
            </div>
          </Section>

          <Section
            icon={FileText}
            title={`${stageBrief.label} — what you submit and what gets marked`}
          >
            <p>
              Your {stageBrief.label} capstone is{" "}
              <strong>{n} {n === 1 ? "document" : "documents"}</strong> — D1 to
              D{n} — in one Google Drive folder. The desk tasks on the mission
              board are the lab work; you fold what you find into these{" "}
              {n === 1 ? "one" : n} deliverables.
            </p>
            <div className="p-3 rounded-lg bg-blue/5 border border-blue/20 text-sm text-foreground">
              Each document is graded as its own rubric section.{" "}
              <strong>A missing document is a zero for that section</strong> —
              not a small deduction. Submit all {n}.
            </div>

            <div className="space-y-3">
              {tasks.map((task, idx) => (
                <Deliverable
                  key={task.id}
                  code={`D${idx + 1}`}
                  title={task.title}
                  description={task.description}
                  deliverable={task.deliverable}
                />
              ))}
            </div>
          </Section>

          {currentStage === "STAGE_4" && (
            <Section icon={FileSignature} title="Templates & the all-in-one artefact pack — live now">
              <p>
                Everything for Stage 4 is here. Open the{" "}
                <strong>all-in-one pack first</strong> to see every template and
                input in one document, then pull the individual file you need.
                These are <strong>scaffolds, not answers</strong> — the findings,
                numbers, and citations are yours to do from your Stage 0-3 evidence.
              </p>
              <div className="space-y-2">
                {STAGE_4_TEMPLATES.map((t) => (
                  <div
                    key={t.file}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3"
                  >
                    <FileText className="h-4 w-4 text-blue shrink-0" />
                    <div className="flex-1 min-w-[180px]">
                      <p className="font-semibold text-foreground text-sm">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.note}</p>
                    </div>
                    <a
                      href={`/capstone/stage-4/${t.file}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue text-white text-xs font-semibold hover:bg-blue/90"
                    >
                      Open →
                    </a>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Input artefacts (read, don&apos;t fill):{" "}
                {STAGE_4_INPUTS.map((t, i) => (
                  <span key={t.file}>
                    {i > 0 ? " · " : ""}
                    <a
                      href={`/capstone/stage-4/${t.file}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-blue underline hover:text-blue/80"
                    >
                      {t.title}
                    </a>
                  </span>
                ))}
              </p>
            </Section>
          )}

          {currentStage === "STAGE_4" && (
            <Section icon={HelpCircle} title="Common questions">
              <div className="space-y-4">
                {STAGE_4_FAQ.map((item) => (
                  <div key={item.q} className="rounded-xl border border-border bg-surface p-4">
                    <p className="font-semibold text-foreground mb-1.5">{item.q}</p>
                    <p className="text-sm text-foreground/85 leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                More questions land in the cohort channel and get answered here. If
                something is unclear, ask and it will be added.
              </p>
            </Section>
          )}

          {currentStage === "STAGE_1" && (
            <Section icon={FileSignature} title="Start from the template">
              <p>
                Don&apos;t build the four documents from a blank page. The Stage 1
                capstone template lays out D1–D4 with the tables, headings, and
                citation placeholders already in place — replace each{" "}
                <code>[ bracketed prompt ]</code> with your own work and delete the
                grey instruction lines.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/capstone/stage-1/stage-1-capstone-template.docx"
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue text-white text-sm font-semibold hover:bg-blue/90"
                >
                  <FileSignature className="h-4 w-4" /> Template — .docx (editable)
                </a>
                <a
                  href="/capstone/stage-1/stage-1-capstone-template.pdf"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue/40 bg-surface text-blue dark:text-blue-300 text-sm font-semibold hover:bg-blue/10"
                >
                  <FileText className="h-4 w-4" /> Template — .pdf (preview)
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                Open the <strong>.docx</strong> in Google Docs (File → Open →
                Upload) or in Word and edit directly. The <strong>.pdf</strong> is
                a read-only preview of the same thing. You can submit the four
                deliverables as one combined document or as four separate files
                (D1–D4) — graders accept either, as long as all four areas are
                covered.
              </p>
            </Section>
          )}

          {currentStage === "STAGE_2" && (
            <Section
              icon={FileSignature}
              title="Start from the templates — one per deliverable"
            >
              <p>
                Don&apos;t build D1–D4 from a blank page. Each deliverable has
                its <strong>own editable template</strong> with the headings,
                tables, citation placeholders, and the grader&apos;s
                discrimination bars already laid out. Replace every{" "}
                <code>[ bracketed prompt ]</code> with your own work and delete
                the grey instruction lines before you submit.
              </p>
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-200 text-sm">
                These are <strong>scaffolds, not answers.</strong> They give you
                the shape of a top-band submission — but the findings, the
                evidence quotes, the CVSS vectors, the decoy verdict, and your
                ethics call are yours to do. The capstone is graded by humans
                against the evidence pack; a template handed in with the brackets
                still in scores zero for that section.
              </div>

              <div className="space-y-2">
                {STAGE_2_TEMPLATES.map((t) => (
                  <div
                    key={t.slug}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3"
                  >
                    <span className="inline-flex items-center justify-center shrink-0 w-9 h-7 rounded-md bg-blue/10 text-blue text-xs font-bold font-mono">
                      {t.code}
                    </span>
                    <span className="text-sm font-semibold text-foreground flex-1 min-w-[12rem]">
                      {t.title}
                    </span>
                    <a
                      href={`/capstone/stage-2/${t.slug}.docx`}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue text-white text-xs font-semibold hover:bg-blue/90"
                    >
                      <FileSignature className="h-3.5 w-3.5" /> Download .docx
                    </a>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                Open the <strong>.docx</strong> in Google Docs (File → Open →
                Upload) or in Word and edit directly. Everything the template
                tells you is also written out below in{" "}
                <strong>&ldquo;How to nail each deliverable&rdquo;</strong> — so
                if a download ever looks off, the FAQ on this page is the
                canonical guide. Remember:{" "}
                <strong>one file per deliverable</strong> — do not merge D1–D4
                into a single document.
              </p>
            </Section>
          )}

          {currentStage === "STAGE_2" && (
            <Section icon={CheckCircle2} title="How to nail each deliverable">
              <p>
                This is the whole template in plain words. Read the five
                evidence files closely first and keep a working note — the lines
                you will quote, the tokens you decode, the capture timestamps,
                the exfil numbers. Then build each deliverable from it. The
                capstone is paper-based: no scans, no live targets — everything
                you need is in the evidence pack.
              </p>
              <div className="space-y-3">
                {STAGE_2_PLAYBOOK.map((d) => (
                  <div
                    key={d.code}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <span className="inline-flex items-center justify-center shrink-0 w-9 h-7 rounded-md bg-blue/10 text-blue text-xs font-bold font-mono">
                        {d.code}
                      </span>
                      <h3 className="text-sm font-bold text-foreground">
                        {d.title}
                      </h3>
                    </div>
                    <div className="space-y-1.5 text-sm leading-relaxed">
                      <p>
                        <span className="font-semibold text-foreground">
                          Do this:
                        </span>{" "}
                        <span className="text-foreground/80">{d.do}</span>
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">
                          Where the marks are:
                        </span>{" "}
                        <span className="text-foreground/80">{d.win}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {currentStage === "STAGE_2" && (
            <Section
              icon={HelpCircle}
              title="Stage 2 — the questions we keep getting"
            >
              <Q q="The desk tasks are also labelled D1–D4 — is the capstone the same thing?">
                No — they are two separate pieces of work. The{" "}
                <strong>desk tasks</strong> are the in-platform lab you click
                through. The <strong>capstone</strong> is the four documents
                (D1–D4) you write <em>off-platform</em> from the evidence pack and
                submit as one Drive folder — and it is the part that carries the
                bulk of your Stage 2 score. The capstone D1–D4 are: D1 Findings
                catalogue, D2 Exploit chain + CVSS &amp; impact, D3 the report
                Bayo acts on, D4 Ethics stance. Those are what the templates above
                cover. <strong>Do not scrap them</strong> — that <em>is</em> the
                capstone.
              </Q>
              <Q q="Tasks 1–6 say to write my findings up in &ldquo;task 9&rdquo; — where is task 9?">
                &ldquo;Task 9&rdquo; is the old name for the pentest write-up, from
                before Stage 2 was restructured — and a few task descriptions
                still carry that label. There is <strong>no in-platform task 9
                any more</strong>: the lab is tasks 1–8, and the pentest finding
                became the <strong>capstone</strong>. So everything tasks 1–6 tell
                you to &ldquo;save for task 9&rdquo; — the service that gave first
                live data, the attacker IP, your SQLi payload and column count,
                the XSS class, the SSRF metadata path and role — goes into your
                capstone documents: <strong>catalogue every weakness in D1, chain
                them in D2, and write the formal report in D3.</strong> Follow the
                capstone instructions; the &ldquo;task 9&rdquo; wording is just a
                leftover label.
              </Q>
              <Q q="How do I actually submit Stage 2? (step by step)">
                Write your four documents (D1–D4) in Google Docs or Word. Put all
                four in <strong>one</strong> Google Drive folder named{" "}
                <code>UBI-STAGE2_&lt;Surname&gt;_&lt;InternCode&gt;</code>. Set the
                folder sharing to <strong>&ldquo;Anyone with the link →
                Viewer&rdquo;</strong> and check it in an incognito window. Then go
                to <code>/dashboard/reports/STAGE_2</code>, paste the{" "}
                <strong>folder URL</strong>, write a short{" "}
                <strong>executive summary</strong> (a few sentences for a
                board-level reader — up to 5,000 characters), and click Submit. You
                can re-submit any time until Stage 2 closes.
              </Q>
              <Q q="The download looked off when I opened it. What do I use?">
                Open the <strong>.docx</strong> (the download button above) in
                Google Docs (File → Open → Upload) or Word — it carries the branded
                layout, headings, tables, and prompts. If you ever want a PDF,
                finish your doc and use <strong>File → Download → PDF</strong> for a
                clean copy of your own work. Either way, everything the template
                says is also written out in{" "}
                <strong>&ldquo;How to nail each deliverable&rdquo;</strong> above,
                so this FAQ page is always the canonical guide.
              </Q>
              <Q q="What goes in the executive summary on the platform?">
                A few plain-English sentences for a board-level reader: the worst
                thing an attacker can do with this app, how many customers and
                roughly how much money is at risk, and the single fix you would do
                first. It is typed into the submission form —{" "}
                <strong>not</strong> inside any of the four documents.
              </Q>
              <Q q="How do I prove a finding — is anything checked on the server?">
                No. The capstone is <strong>paper-based and human-graded</strong> —
                there is no live target and nothing auto-checks your work. You
                prove a finding by <strong>quoting the exact line or request</strong>{" "}
                that shows it (from the source, the tokens, the XML, or the capture)
                and giving a reproducible PoC — the exact request, the forged token
                shown as <code>header.payload.signature</code>, or the exact XML
                body. A described exploit scores nothing; a shown one scores.
              </Q>
              <Q q="How many findings are there, and is there really a decoy?">
                Nobody tells you the count — finding them all is the work.
                Catalogue every weakness you can substantiate from the source, the
                three tokens, the XML import, and the capture. And yes: one
                construct looks hand-rolled and dangerous but may be safe. Decide
                whether it is exploitable and <strong>prove your verdict either
                way</strong> — a mechanism-level disproof scores as hard as a real
                finding, and flagging a safe construct Critical costs you. Trust the
                code, not the developer&apos;s comments.
              </Q>
              <Q q="How do I score CVSS, and what about the chain?">
                Give every substantiated finding a full{" "}
                <strong>CVSS 3.1 vector string</strong> — a bare number is rejected.
                Justify the non-obvious metrics, especially any{" "}
                <strong>scope change (S:C)</strong> where a flaw in{" "}
                <code>/legacy-admin/</code> yields access or data for the wider
                platform. Where two weaknesses only matter together, score the{" "}
                <strong>chain</strong>, not just the parts.
              </Q>
              <Q q="What must D4 (the ethics stance) cite?">
                At least one <strong>ISC2 Code of Ethics canon, by number</strong>,
                and the <strong>GDPR</strong> breach-notification duty that applies
                once you have confirmed PII left the building. 300–500 words, your
                own voice, and anchor at least one sentence to your own Stage 2
                work — two graders read it independently and a generic, untraceable
                answer is treated as not submitted.
              </Q>
            </Section>
          )}

          {currentStage === "STAGE_3" && (
            <Section
              icon={FileSignature}
              title="Start from the templates — one per deliverable"
            >
              <p>
                Stage 3 is writing-heavy by design — incident response{" "}
                <em>is</em> a documentation discipline. Don&apos;t build the five
                deliverables from a blank page. Each has its own template with
                the headings, tables, and a{" "}
                <strong>&ldquo;what we look for&rdquo;</strong> checklist already
                laid out — in both editable <strong>.docx</strong> and{" "}
                <strong>.pdf</strong>.
              </p>
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-200 text-sm">
                These are <strong>scaffolds, not answers.</strong> The findings,
                the evidence lines, the IOCs, the technique IDs, and the root
                cause are yours to do from the evidence pack. A template handed in
                with the brackets still in scores zero for that deliverable.
              </div>

              <div className="space-y-2">
                {STAGE_3_TEMPLATES.map((t) => (
                  <div
                    key={t.slug}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3"
                  >
                    <span className="inline-flex items-center justify-center shrink-0 w-9 h-7 rounded-md bg-blue/10 text-blue text-xs font-bold font-mono">
                      {t.code}
                    </span>
                    <span className="text-sm font-semibold text-foreground flex-1 min-w-[12rem]">
                      {t.title}
                    </span>
                    <a
                      href={`/capstone/stage-3/${t.slug}.docx`}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue text-white text-xs font-semibold hover:bg-blue/90"
                    >
                      <FileSignature className="h-3.5 w-3.5" /> .docx
                    </a>
                    <a
                      href={`/capstone/stage-3/${t.slug}.pdf`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue/40 bg-surface text-blue dark:text-blue-300 text-xs font-semibold hover:bg-blue/10"
                    >
                      <FileText className="h-3.5 w-3.5" /> .pdf
                    </a>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                Open the <strong>.docx</strong> in Google Docs (File → Open →
                Upload) or Word and edit directly; the <strong>.pdf</strong> is a
                read-only preview of the same thing. Everything the templates say
                is also written out below in{" "}
                <strong>&ldquo;How to nail each deliverable&rdquo;</strong> — so
                this FAQ page is always the canonical guide.
              </p>
            </Section>
          )}

          {currentStage === "STAGE_3" && (
            <Section icon={CheckCircle2} title="How to nail each deliverable">
              <p>
                Stage 3 is one incident — a compromised finance workstation. The
                desk tasks are where you <em>find</em> things; these five
                deliverables are where you <strong>write them up</strong> and are
                graded. Keep a running findings note as you work the tasks; every
                deliverable draws on it.
              </p>
              <div className="space-y-3">
                {STAGE_3_PLAYBOOK.map((d) => (
                  <div
                    key={d.code}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <span className="inline-flex items-center justify-center shrink-0 w-9 h-7 rounded-md bg-blue/10 text-blue text-xs font-bold font-mono">
                        {d.code}
                      </span>
                      <h3 className="text-sm font-bold text-foreground">
                        {d.title}
                      </h3>
                    </div>
                    <div className="space-y-1.5 text-sm leading-relaxed">
                      <p>
                        <span className="font-semibold text-foreground">
                          Do this:
                        </span>{" "}
                        <span className="text-foreground/80">{d.do}</span>
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">
                          What we look for:
                        </span>{" "}
                        <span className="text-foreground/80">{d.win}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {currentStage === "STAGE_3" && (
            <Section
              icon={HelpCircle}
              title="Stage 3 — the questions we keep getting"
            >
              <Q q="The desk tasks feel like a whole capstone. What do I actually submit?">
                Stage 3 is documentation-heavy on purpose — incident response is a
                writing discipline. The desk tasks are where you investigate; the{" "}
                <strong>five deliverables</strong> (process triage · incident
                timeline · IOC list · ATT&amp;CK map · incident report) are what
                gets graded. Use the templates above as your skeleton so you are
                filling in, not staring at a blank page.
              </Q>
              <Q q="As I do tasks 1–4, should I write down every finding?">
                <strong>Yes — keep a running findings list.</strong> Every
                artefact and evidence path you uncover in tasks 1–4 feeds the
                timeline (D2), the IOC list (D3), and the ATT&amp;CK map (D4).
                Don&apos;t lose a single evidence path — note the file and line as
                you go. Pay special attention to the lateral-movement / C2 work:
                note what is genuinely this host&apos;s activity versus unrelated
                background traffic, because the deliverables reward correct
                attribution and penalise listing noise as a finding.
              </Q>
              <Q q="Where does the &ldquo;one mistake I almost made&rdquo; go — in the Google Doc or the task notepad?">
                In the <strong>Google Doc</strong>, as the closing reflection of
                that deliverable. The notepad on the task only holds your{" "}
                <strong>Doc link + the short abstract</strong> — the content
                (including the reflection) lives in the Doc itself. Set the
                Doc&apos;s sharing to &ldquo;Anyone with the link → Viewer&rdquo;
                before you paste the link.
              </Q>
              <Q q="How long should the incident report be?">
                The deliverable target is <strong>5–7 pages</strong>, structured
                (executive summary ≤200 words, scope, timeline summary, root
                cause, what was accessed, containment, eradication, lessons,
                policy). Tight and complete beats padded — the exec summary is
                judged on whether a non-analyst could act on it, not on length.
              </Q>
              <Q q="If I clear the mark threshold on a couple of high-value tasks, do I have to do the rest?">
                There&apos;s no rule forcing every deliverable — but each one you
                skip is points <em>and</em> ranking you give up, each is graded
                separately, and the cutoff is competitive. Spend your effort where
                it counts, but completeness is what protects you when the cutoff
                lands. Do the maths with your eyes open.
              </Q>
              <Q q="I was marked as not submitting a deliverable that I did submit. How do I avoid / fix that?">
                Before the deadline: put every deliverable in your shared folder,
                set each file&apos;s sharing to{" "}
                <strong>&ldquo;Anyone with the link → Viewer&rdquo;</strong>, and
                open the folder in a private/incognito window to confirm all of
                them are visible without logging in. If you did submit on time and
                a deliverable was still marked missing, raise it through the{" "}
                <strong>&ldquo;Open my feedback&rdquo;</strong> link in your result
                email with the folder link and the submission timestamp — that is
                the channel that can correct a grading error.
              </Q>
            </Section>
          )}

          {currentStage === "STAGE_3" && (
            <Section
              icon={FileSignature}
              title="Start from the templates — one per deliverable"
            >
              <p>
                Each of the five deliverables has its{" "}
                <strong>own template</strong> — the headings, tables, and a{" "}
                &ldquo;what we&apos;re looking for&rdquo; checklist already laid
                out. Replace every <code>[ bracketed prompt ]</code> with your own
                work and delete the grey instruction lines before you submit.
              </p>
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-200 text-sm">
                These are <strong>scaffolds, not answers.</strong> The findings,
                the timeline, the IOCs, the ATT&amp;CK IDs, and the report are
                yours to do from the evidence pack — graded by humans. A template
                handed in with the brackets still in scores zero for that section.
              </div>
              <div className="space-y-2">
                {STAGE_3_TEMPLATES.map((t) => (
                  <div
                    key={t.slug}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3"
                  >
                    <span className="inline-flex items-center justify-center shrink-0 w-9 h-7 rounded-md bg-blue/10 text-blue text-xs font-bold font-mono">
                      {t.code}
                    </span>
                    <span className="text-sm font-semibold text-foreground flex-1 min-w-[12rem]">
                      {t.title}
                    </span>
                    <a
                      href={`/capstone/stage-3/${t.slug}.docx`}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue text-white text-xs font-semibold hover:bg-blue/90"
                    >
                      <FileSignature className="h-3.5 w-3.5" /> .docx
                    </a>
                    <a
                      href={`/capstone/stage-3/${t.slug}.pdf`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue/40 bg-surface text-blue dark:text-blue-300 text-xs font-semibold hover:bg-blue/10"
                    >
                      <FileText className="h-3.5 w-3.5" /> .pdf
                    </a>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Open the <strong>.docx</strong> in Google Docs (File → Open →
                Upload) or Word and edit directly; the <strong>.pdf</strong> is a
                read-only preview. Everything the template says is also written
                out below in{" "}
                <strong>&ldquo;How to nail each deliverable&rdquo;</strong>, so if
                a download ever looks off, this FAQ is the canonical guide.
              </p>
            </Section>
          )}

          {currentStage === "STAGE_3" && (
            <Section icon={CheckCircle2} title="How to nail each deliverable">
              <p>
                Stage 3 is a full incident-response project. Keep a{" "}
                <strong>running findings log</strong> from the very first desk
                task — every artefact, evidence path, IP, file, hash, and
                timestamp, with the exact line. The five written deliverables are
                assembled from that log; you cannot write them from memory.
              </p>
              <div className="space-y-3">
                {STAGE_3_PLAYBOOK.map((d) => (
                  <div
                    key={d.code}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <span className="inline-flex items-center justify-center shrink-0 w-9 h-7 rounded-md bg-blue/10 text-blue text-xs font-bold font-mono">
                        {d.code}
                      </span>
                      <h3 className="text-sm font-bold text-foreground">
                        {d.title}
                      </h3>
                    </div>
                    <div className="space-y-1.5 text-sm leading-relaxed">
                      <p>
                        <span className="font-semibold text-foreground">
                          Do this:
                        </span>{" "}
                        <span className="text-foreground/80">{d.do}</span>
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">
                          Where the marks are:
                        </span>{" "}
                        <span className="text-foreground/80">{d.win}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {currentStage === "STAGE_3" && (
            <Section
              icon={HelpCircle}
              title="Stage 3 — the questions we keep getting"
            >
              <Q q="Where does &ldquo;One mistake I almost made&rdquo; go — in the Google Doc or the answer box?">
                <strong>Inside the Google Doc.</strong> It is a required section
                of the incident report (near the end, with the rejected-alternate-theory
                section). The answer box on the task only takes the{" "}
                <strong>Doc link plus your 100-word abstract</strong> — not the
                report content. Same for the timeline, ATT&amp;CK table, and
                everything else: it all lives in the Doc; the box just points to
                it.
              </Q>
              <Q q="Do I have to complete every deliverable, or can I just do the high-point ones?">
                Do them all. Each deliverable is its <strong>own graded
                section</strong>, and your Stage 3 score is the total across all
                five — the advance cutoff and the leaderboard both use that full
                score, so a deliverable you skip is a zero you can&apos;t earn
                back elsewhere. Banking the two biggest and stopping leaves marks
                (and rank) on the table.
              </Q>
              <Q q="I was told I didn't submit a deliverable that I actually did. How do I avoid that?">
                Put <strong>all five deliverables in one Drive folder</strong>,
                name each file clearly (D1–D5 or the deliverable name), and set the{" "}
                <strong>folder and every file</strong> to &ldquo;Anyone with the
                link → Viewer.&rdquo; Open the folder link in an incognito window
                before the deadline — if you can read every file logged out, the
                grader can. If you believe a submitted deliverable was missed in
                grading, raise it through the <strong>feedback link in your result
                email</strong> with your folder link and the file names — that is
                the channel that gets reviewed.
              </Q>
              <Q q="The desk tasks feel like a capstone on their own. How do I keep up?">
                They are demanding by design — Stage 3 is a full IR engagement.
                The trick is that the written deliverables <em>reuse</em> your
                desk-task work: the timeline, the IOC list, the ATT&amp;CK map,
                and the report are all built from the notes you take while doing
                the hands-on tasks. Capture everything as you go — especially the
                lateral-movement evidence (or your proof that there is none) — and
                the write-ups go much faster.
              </Q>
              <Q q="How long does the incident report need to be, and what structure?">
                <strong>Minimum 1,500 words</strong>, in the NIST 800-61r2{" "}
                <strong>PICERL</strong> structure — executive summary, scope,
                preparation, identification, containment, eradication, recovery,
                lessons learned, a 12+ row timeline table (with H/M/L confidence),
                ATT&amp;CK summary, risk register, references (8+), evidence
                appendix, a rejected-alternate-theory section, and &ldquo;one
                mistake I almost made.&rdquo; The D5 template lays out every
                section — start from it.
              </Q>
            </Section>
          )}

          <Section
            icon={FileText}
            title="File names — exact format"
          >
            <p>Name each file using this pattern:</p>
            <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg font-mono leading-relaxed overflow-x-auto">
              {tasks
                .map(
                  (task, idx) =>
                    `D${idx + 1}-${deliverableSlug(task.deliverable)}-<YourLastName>.docx`,
                )
                .join("\n")}
            </pre>
            <ul className="list-disc pl-5 space-y-1">
              <li>No spaces in the file name. Use dashes.</li>
              <li>Your last name exactly as it appears on your acceptance email.</li>
              <li>Same pattern across stages — only the deliverable codes change per brief.</li>
              <li>
                Google Doc files don&apos;t have a .docx extension on
                Drive — the file just shows the Doc icon. That&apos;s
                fine; the grader can still read it. Optional: download
                each Doc as <code>.docx</code> back into the folder for
                a frozen copy.
              </li>
            </ul>
          </Section>

          <Section
            icon={FileSignature}
            title="Format — Google Docs or DOCX (the easy path)"
          >
            <p>
              Write each deliverable in <strong>Google Docs</strong> or
              <strong> Microsoft Word</strong>. Upload the Doc (or the .docx
              export) into your stage folder. That&apos;s it.
            </p>
            <p>
              Earlier cohorts had to convert everything to PDF before
              uploading — and a lot of marks were lost to PDFs that came
              out as blank pages, missing fonts, or single-line tables.
              Docs avoids that entirely. The graders open the Doc directly.
            </p>
            <div className="p-3 rounded-lg bg-blue/5 border border-blue/20 text-sm text-foreground">
              <strong>Why this changed:</strong> graders read on web,
              mobile, and the occasional iPad. Google Docs renders the same
              on all three. PDFs, surprisingly, do not. So we switched.
            </div>
            <p className="text-sm text-muted-foreground">
              PDF is still accepted if you prefer it. DOCS is recommended.
              Either is fine; just <strong>don&apos;t</strong> upload .pages,
              .odt, .txt, or a screenshot of a doc.
            </p>
          </Section>

          <Section
            icon={CheckCircle2}
            title="Every deliverable must include"
          >
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>A header on page 1</strong> with: your full name,
                your UBI Intern ID (UBI-2026-XXXX), the deliverable code
                (D1 … D{n}), the stage label, and the date.
              </li>
              <li>
                <strong>Page numbers</strong> on every page. Footer or
                header — your choice.
              </li>
              <li>
                <strong>Citations to the evidence pack.</strong> When you
                quote a line, a value, or a record from an evidence file, cite
                the file and where it came from, e.g.{" "}
                <code>&lt;evidence-file&gt;:&lt;line&gt;</code> or{" "}
                <code>&lt;evidence-file&gt;: &lt;section&gt;</code>. Verbatim
                quotes only — no paraphrasing.
              </li>
              <li>
                <strong>Section headings.</strong> The brief tells you
                which sections each deliverable needs. Don't merge them
                into one long block.
              </li>
              <li>
                <strong>Your own writing.</strong> Heavy AI patterns cost
                marks. Grounded, specific, factual writing reads
                differently — and that's what we look for.
              </li>
            </ol>
          </Section>

          <Section
            icon={Folder}
            title="Sharing settings — the trap that loses marks"
          >
            <p>
              Drive does <strong>not inherit folder sharing onto the files
              inside it</strong>. If you share only the folder, the grader
              opens it and sees the file list but can't read any single
              file.
            </p>
            <p>For every file inside the folder, do this:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Right-click the file → Share.</li>
              <li>Change "Restricted" to "Anyone with the link".</li>
              <li>Confirm the role is "Viewer".</li>
              <li>Save / close.</li>
            </ol>
            <p>
              Then test the link in a private window — if you can read it
              without logging in, the grader can.
            </p>
          </Section>

          <Section
            icon={CheckCircle2}
            title="What gets you a full mark"
          >
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Every claim is grounded in a specific line from the evidence
                pack. No "in general", no "typically".
              </li>
              <li>
                Numbers are exact. If you say "the same IP returned 25
                hours later", show the two timestamps.
              </li>
              <li>
                Recommendations are concrete. "Tighten security" is
                not a recommendation. "Require a second analyst signature
                on any Medium+ ticket closed as resolved-by-reference" is.
              </li>
              <li>
                You write like a person who saw something and wants to
                explain it — not like a textbook.
              </li>
              <li>
                Your D4 references your own D1 and D2 — show that the
                reasoning hangs together across documents.
              </li>
            </ul>
          </Section>

          <Section
            icon={ShieldAlert}
            title="Things that cost marks"
            tone="rose"
          >
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Paraphrasing the ticket disposition column instead of
                quoting it verbatim. The exact wording matters.
              </li>
              <li>
                Putting placeholder text in the submission (<code>[actor]</code>,
                <code>[method]</code>, <code>[N]</code>). If you copied a
                template, fill in every blank.
              </li>
              <li>
                Submitting fewer than the {n} deliverables. Each missing
                document is a missing rubric section.
              </li>
              <li>
                Heavy AI cadence: paragraph-long disclaimers, "it is
                important to note that", "in conclusion", filler that
                doesn't say anything.
              </li>
              <li>
                Wrong sharing settings — see above. Graders won't chase
                you; the report will be marked on whatever they can read.
              </li>
            </ul>
          </Section>

          <Section
            icon={HelpCircle}
            title="Resubmission, deadlines, and questions"
          >
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                You can resubmit until the stage deadline. Pasting a new
                link replaces the old one — keep the same folder, just
                update the files.
              </li>
              <li>
                Past the deadline the stage closes for everyone. We don't
                accept late submissions individually.
              </li>
              <li>
                Questions about a specific deliverable go in the Stage
                Slack channel. Don't email them.
              </li>
              <li>
                Questions about your grade after results go in via the
                "Open my feedback" link in your result email. That's the
                channel that's actually monitored for grade discussions.
              </li>
            </ul>
          </Section>

          {currentStage === "STAGE_2" && (
            <Section icon={HelpCircle} title="Stage 2 — questions we keep getting">
              <Q q="Task 3 / Task 6 say “✓ Verified” — do I still type the flag myself?">
                No. Task 3 (SQL injection) and Task 6 (SSRF) are checked on the
                server: when your payload is correct, the flag is generated for
                you and dropped into the &ldquo;Your answer&rdquo; box. Scroll
                down and click <strong>Submit</strong> — you do not type the{" "}
                <code>{"TRAN{…}"}</code> yourself. If the box ever looks empty
                after &ldquo;Verified&rdquo;, hard-refresh (Ctrl/Cmd+Shift+R) and
                re-run your payload.
              </Q>
              <Q q="Is Task 4 a SQL injection challenge?">
                No — Task 4 is a <strong>cross-site scripting (XSS)</strong> task.
                The customer search field reflects what you type back into the
                page without escaping it; your job is to craft input the browser
                would run as markup, and confirm the injection point. See the
                task&apos;s references — OWASP A03:2021 Injection / the XSS
                Prevention Cheat Sheet, CWE-79. Telling it apart from the SQLi
                task is part of the test.
              </Q>
              <Q q="The deliverable mentions a “BoltCash launch timeline” — which evidence file is that?">
                It isn&apos;t a file. The BoltCash timeline is in your stage
                briefing / notices: <strong>BoltCash ships in ~6 weeks</strong>.
                Use that 6-week window as the urgency anchor for your
                business-impact section, and take the affected-record count from{" "}
                <code>05-exfil-sample.csv</code>. You&apos;re not missing an
                artefact.
              </Q>
              <Q q="How many findings are there? The task won’t tell me what’s broken.">
                That&apos;s deliberate. Part of Stage 2 is deciding for yourself
                what is and isn&apos;t a real, exploitable finding — and
                disproving the one that looks worse than it is. Catalogue every
                weakness you can prove from the source, the tokens, and the
                capture, and cite the exact line or request for each.
              </Q>
              <Q q="The task pages are dark and the light/dark toggle doesn’t change them — is that broken?">
                No, that&apos;s intentional. The task environment (terminal, log
                viewer, app simulator) is a fixed dark console theme. The
                light/dark toggle styles the main dashboard — profile, reports,
                leaderboard, team — not the task pages.
              </Q>
              <Q q="Where do I download the Stage 2 evidence pack?">
                On the capstone page (<code>/dashboard/reports/STAGE_2</code>) and
                on the Stage 2 landing page: the five files — the recovered login
                source, the HTTP capture, the tokens, the XML import, and the
                exfil sample. Download each, analyse it locally, and cite specific
                lines in your deliverables.
              </Q>
            </Section>
          )}

          <Section icon={HelpCircle} title="The other questions we keep getting">
            <Q q="Can I work with another intern?">
              No. Every deliverable must be your own writing. You can
              discuss the brief in Slack and you can ask mentors questions
              — but the words in your Doc have to be yours. Identical
              passages across two interns get both submissions flagged.
            </Q>
            <Q q="My Drive folder name has my name. Is that OK?">
              Yes. The folder name doesn&apos;t matter — only the file names
              inside it do (
              <code>D1-{deliverableSlug(tasks[0].deliverable)}-Surname.docx</code>{" "}
              etc.).
            </Q>
            <Q q="Can I use AI to help me write?">
              Use it for brainstorming and to check your spelling. Don't
              paste its output as your deliverable. Graders mark heavy
              AI-cadence answers down and may flag the submission.
              Particularly for D4 — the ethics stance is the one we look
              hardest for AI signal on.
            </Q>
            <Q q="What if I miss the deadline by a few minutes?">
              The stage closes hard at the deadline. The submission API
              rejects anything after. Plan to ship 20 minutes early.
            </Q>
            <Q q="What if my computer dies / Wi-Fi drops on deadline day?">
              Anything you've already pasted into your stage report
              persists. Use the Data Scholarship if your connectivity is
              the issue — it's there for exactly this.
            </Q>
            <Q q="Can I submit a Google Doc share link instead of a file in the folder?">
              No share-link-only submissions. The grader needs to see the
              document inside your stage folder — that&apos;s what we
              archive. Drop the Google Doc into the folder (or download
              it as .docx and upload that). Either is fine; just don&apos;t
              paste a bare Doc URL in the submission form.
            </Q>
            <Q q="Do I need to sign my deliverables?">
              The header on page 1 (name + intern ID) is your signature.
              No need for a separate signature image.
            </Q>
            <Q q="How long until I get my grade?">
              The programme office publishes results stage-by-stage. You
              get a result email when your stage finishes grading — usually
              within 7–10 days of the stage deadline.
            </Q>
            <Q q="Can I appeal a grade?">
              Yes, via the "Open my feedback" link in your result email.
              Read the reviewer notes first; appeals that don't cite
              specific points in the feedback rarely move the score.
            </Q>
            <Q q="I lost my Intern ID. Where do I find it?">
              It's in your acceptance email and on your dashboard top-right
              corner. Format is UBI-2026-XXXX.
            </Q>
            <Q q="The Data Scholarship form says my Intern ID is invalid. What now?">
              The form accepts spaces, lowercase, and missing leading
              zeros (UBI-2026-3 is treated the same as UBI-2026-0003). If
              it's still rejecting, double-check you're typing the ID
              that came in YOUR acceptance email — sometimes interns try
              a friend's ID by mistake.
            </Q>
            <Q q="Can I share screenshots of the brief or the artefacts on social?">
              No. Stage materials are confidential under the NDA you
              signed. Read the pinned NDA notice on your dashboard for
              the full rules.
            </Q>
          </Section>

          <Section icon={BookOpen} title="The story so far">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The capstones are not isolated essays — they're chapters of
              one ongoing case. Knowing where you sit in the arc makes the
              brief easier to read and the recommendations easier to
              ground. Skim before you start writing.
            </p>

            <div className="space-y-5 mt-4">
              {(["STAGE_0", "STAGE_1", "STAGE_2", "STAGE_3", "STAGE_4"] as const).map(
                (key) => {
                  const rank = Number(key.split("_")[1]);
                  const slug = STAGE_ENUM_TO_SLUG[key] as StageSlug;
                  const story = STAGE_STORIES[slug];
                  const chapterTitle = CHAPTER_TITLES[rank] ?? STAGE_BRIEFS[key].label;
                  const isCurrent = rank === currentRank;
                  const isLocked = rank > currentRank;
                  const suffix = isCurrent ? " — you are here" : isLocked ? " — locked" : "";
                  return (
                    <StoryChapter
                      key={key}
                      num={rank + 1}
                      title={`${STAGE_BRIEFS[key].label} · ${chapterTitle}${suffix}`}
                      where={story?.office ?? ""}
                      summary={
                        story?.previously ??
                        STAGE_BRIEFS[key].subtitle
                      }
                      cliffhanger={story?.cliffhanger ?? null}
                      isCurrent={isCurrent}
                      isLocked={isLocked}
                    />
                  );
                },
              )}
            </div>

            <p className="text-xs text-muted-foreground italic mt-2">
              {TOTAL_CHAPTERS} chapters in all — clear your current stage to
              unlock the next. No spoilers beyond where you stand.
            </p>
          </Section>

          <p className="mt-10 text-sm text-muted-foreground text-center">
            One sentence to remember:{" "}
            <strong className="text-foreground">
              cite the line, name the number, ship the Doc, share every file.
            </strong>
          </p>
        </div>
      </div>
    </>
  );
}

function StoryChapter({
  num,
  title,
  where,
  summary,
  cliffhanger,
  isCurrent,
  isLocked,
}: {
  num: number;
  title: string;
  where: string;
  summary: string;
  cliffhanger: string | null;
  isCurrent?: boolean;
  isLocked?: boolean;
}) {
  return (
    <div
      className={`relative rounded-xl border p-4 ${
        isCurrent
          ? "border-blue/40 bg-blue/5"
          : isLocked
            ? "border-border bg-surface-hover opacity-80"
            : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
            isCurrent
              ? "bg-blue text-white"
              : isLocked
                ? "bg-surface-hover text-muted"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
          }`}
        >
          {num}
        </span>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {isCurrent && (
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue text-white">
            you are here
          </span>
        )}
        {isLocked && (
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-hover text-muted">
            locked
          </span>
        )}
      </div>
      <div className="text-xs text-muted-foreground font-mono mb-2">{where}</div>
      <p className="text-sm text-foreground/85 leading-relaxed mb-2">
        {summary}
      </p>
      {cliffhanger && (
        <div className="mt-2 pt-2 border-t border-border/60 text-xs italic text-foreground/70 leading-relaxed">
          <strong className="not-italic text-foreground/90">Next:</strong>{" "}
          {cliffhanger}
        </div>
      )}
    </div>
  );
}

function Q({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-border last:border-0 py-3">
      <summary className="cursor-pointer list-none flex items-start justify-between gap-3">
        <span className="text-sm font-semibold text-foreground group-hover:text-blue transition-colors">
          {q}
        </span>
        <span className="text-muted-foreground text-xs mt-0.5 shrink-0 group-open:rotate-180 transition-transform">
          ▾
        </span>
      </summary>
      <div className="mt-2 text-sm text-foreground/80 leading-relaxed pl-1">
        {children}
      </div>
    </details>
  );
}

function Deliverable({
  code,
  title,
  description,
  deliverable,
}: {
  code: string;
  title: string;
  description: string;
  deliverable: string;
}) {
  // Task titles may already carry a "D1 — " prefix; the badge shows the code,
  // so strip it to avoid "D1   D1 — ...".
  const cleanTitle = title.replace(/^D\d+\s*[—-]\s*/i, "");
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2.5 mb-2.5">
        <span className="inline-flex items-center justify-center shrink-0 w-9 h-7 rounded-md bg-blue/10 text-blue text-xs font-bold font-mono">
          {code}
        </span>
        <h3 className="text-sm font-bold text-foreground">{cleanTitle}</h3>
      </div>
      <div className="space-y-1.5 text-sm leading-relaxed">
        <p className="text-foreground/80">{description}</p>
        <p>
          <span className="font-semibold text-foreground">Submit as:</span>{" "}
          <span className="text-foreground/80">{deliverable}</span>
        </p>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  tone = "default",
  children,
}: {
  icon: React.ElementType;
  title: string;
  tone?: "default" | "rose";
  children: React.ReactNode;
}) {
  const iconTone =
    tone === "rose"
      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30"
      : "bg-blue/10 text-blue dark:text-blue-300 border-blue/30";
  return (
    <section className="mb-8 bg-surface border border-border rounded-2xl p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border ${iconTone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      <div className="text-sm text-foreground/85 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}
