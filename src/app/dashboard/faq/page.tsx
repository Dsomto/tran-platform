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
    slug: "stage-2-d1-recon-template",
    title: "Intrusion reconstruction & access timeline",
  },
  {
    code: "D2",
    slug: "stage-2-d2-exploit-template",
    title: "Exploitation proof pack — the full kill-chain",
  },
  {
    code: "D3",
    slug: "stage-2-d3-report-template",
    title: "Penetration test finding + board brief",
  },
  {
    code: "D4",
    slug: "stage-2-d4-ethics-template",
    title: "The ethics call (exactly 2 pages)",
  },
] as const;

/** Plain-language "what to actually do + where the marks are" for each Stage 2
 *  deliverable. Mirrors the template guidance as web content, so interns get
 *  the full picture even without opening a download. */
const STAGE_2_PLAYBOOK = [
  {
    code: "D1",
    title: "Intrusion reconstruction & access timeline (3–5 pages)",
    do: "Build a UTC timeline from the first scan to the first data exfil, one row per attacker action (Time · Event · Source artefact · Why it matters), with a sentence of commentary under each row.",
    win: "Prove the first LIVE data came from Elasticsearch, not Redis, using the clock (03:06:44 is after the scan was cut off at 03:06:12). Name the attacker IP by behaviour — the python-requests user-agent that actually retrieved .env — not by who appeared first.",
  },
  {
    code: "D2",
    title: "Exploitation proof pack — the kill-chain (3–5 pages)",
    do: "One section per link, in exploit order: SQL injection → reflected XSS → stored XSS → SSRF. For each, paste your EXACT payload and the VERBATIM server/lab response (your flag) that proves it worked.",
    win: "The SQLi and SSRF payloads are checked on the server — a described exploit scores nothing. Include your first failed attempt for both. Keep reflected XSS (search field) and stored XSS (notes) in separate sections — confusing them is the most common mistake.",
  },
  {
    code: "D3",
    title: "Pen-test finding + board brief (3–5 pages)",
    do: "Pick ONE vuln (SQLi or SSRF). Write the formal finding — Title, CVSS v3.1 vector, reproduction with a curl, impact, root cause, the fix AND what would NOT fix it, OWASP+CWE+MITRE refs, evidence appendix, retest plan, proof of work — then a one-page jargon-free board brief.",
    win: "Correct CVSS vector (the SSRF usually scores higher — scope change to cloud credentials). Name the root CAUSE (string-concatenated SQL), not the symptom ('input not validated'). Citing a decoy as load-bearing costs you (−4).",
  },
  {
    code: "D4",
    title: "The ethics call — exactly 2 pages",
    do: "Two one-page answers in your own voice: the scope-line/real-PII dilemma, and the out-of-scope host you discover. Name the ISC2 Code of Ethics canon AND the NDPA obligation that applies, and say what the right choice costs you.",
    win: "Anchor every answer to what YOU did in Stage 2. Two graders read D4 independently; if both find it generic or untraceable to your own work, it is treated as not submitted.",
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
                the shape of a top-band submission — they can&apos;t do the work
                for you. The SQLi and SSRF payloads are checked on the server,
                and two graders read D4 for your own voice. A template handed in
                with the brackets still in scores zero for that section.
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
                This is the whole template in plain words. Do the lab first and
                keep a scratch file — payloads, server responses, timestamps,
                your flags. Then build each deliverable from it.
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
              <Q q="How do I actually submit Stage 2? (step by step)">
                Write your four documents (D1–D4) in Google Docs or Word. Put
                all four in <strong>one</strong> Google Drive folder named{" "}
                <code>UBI-STAGE2_&lt;Surname&gt;_&lt;InternCode&gt;</code>. Set the
                folder sharing to <strong>&ldquo;Anyone with the link →
                Viewer&rdquo;</strong> and check it in an incognito window. Then
                go to <code>/dashboard/reports/STAGE_2</code>, paste the{" "}
                <strong>folder URL</strong>, type your{" "}
                <strong>75-word executive summary</strong>, and click Submit. You
                can re-submit any time until Stage 2 closes.
              </Q>
              <Q q="The template looked off when I opened it. What do I use?">
                Open the <strong>.docx</strong> (the download button above) in
                Google Docs (File → Open → Upload) or Word — it carries the
                branded layout, headings, tables, and prompts. If you ever want a
                PDF, finish your doc and use{" "}
                <strong>File → Download → PDF</strong> — that gives you a clean
                PDF of your own work. Either way, everything the template says is
                also written out in{" "}
                <strong>&ldquo;How to nail each deliverable&rdquo;</strong> above,
                so this FAQ page is always the canonical guide.
              </Q>
              <Q q="What goes in the 75-word executive summary?">
                Four things, in plain English: which vulnerability you wrote up
                in D3, the root cause in one line, the highest-risk impact, and
                your CVSS base score. It is typed into the form on the platform —{" "}
                <strong>not</strong> inside any of the four documents.
              </Q>
              <Q q="How do I prove the SQL injection / SSRF actually worked?">
                Paste your <strong>exact payload</strong> and the{" "}
                <strong>verbatim server response</strong> (your flag or the
                verifier&apos;s success output). These two are checked on the
                server — a described exploit scores nothing, a working one
                scores. Also paste your <strong>first failed attempt</strong> and
                one line on why it failed; a clean one-shot with no failure reads
                as copied.
              </Q>
              <Q q="Reflected vs stored XSS — how do I tell them apart in my write-up?">
                <strong>Reflected</strong> lives in the request and is echoed
                back in that same response (the search field) — blast radius is
                &ldquo;anyone who clicks my crafted link.&rdquo;{" "}
                <strong>Stored</strong> is saved server-side (the notes/comments
                feature) and fires for <em>every</em> viewer of the page, no link
                needed. Give them <strong>separate sections</strong> in D2 —
                merging them costs marks.
              </Q>
              <Q q="The brief points at Redis, but is that right?">
                No — that is the trap. The first <em>live</em> customer data came
                from the unauthenticated <strong>Elasticsearch</strong> service.
                Prove it with the clock: the first live query at{" "}
                <code>03:06:44</code> happened <em>after</em> the scan was cut off
                at <code>03:06:12</code>. Citing Redis (or an inline{" "}
                <code>TRAN&#123;not-here&#125;</code> token) as load-bearing loses
                points in D1 and again in D3.
              </Q>
              <Q q="Which IP is the attacker?">
                Not the first one to touch <code>/legacy-admin</code>. The
                attacker is the source whose user-agent is a tool
                (<code>python-requests</code>) and that actually{" "}
                <strong>retrieved <code>.env</code></strong>. Attribute by
                behaviour, not by order of appearance.
              </Q>
              <Q q="What CVSS do I use, and can a decoy really cost me marks?">
                Use a <strong>CVSS v3.1 vector</strong> in D3 and justify each
                metric — the SSRF often scores higher because it changes scope
                (web app → cloud credentials). And yes: citing a decoy as
                load-bearing evidence is an explicit deduction (−4 in D3), so
                trust the timestamps over the banner.
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
