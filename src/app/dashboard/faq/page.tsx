import { requireAuth } from "@/lib/auth";
import { Topbar } from "@/components/dashboard/topbar";
import {
  FileText,
  Folder,
  CheckCircle2,
  ShieldAlert,
  HelpCircle,
  FileSignature,
  BookOpen,
  Download,
} from "lucide-react";
import { STAGE_STORIES } from "@/lib/stage-story";

export const dynamic = "force-dynamic";

export default async function FAQPage() {
  const session = await requireAuth();

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
            icon={Folder}
            title="What you submit, in plain terms"
          >
            <p>
              Every stage capstone is a <strong>four-document pack</strong>:
              D1, D2, D3, D4. Each one has its own brief inside the stage
              mission board. You write each one in <strong>Google Docs</strong>{" "}
              or Microsoft Word, upload all four into a Google Drive folder,
              then paste the folder link into the submission form on{" "}
              <code className="text-foreground">/dashboard/reports</code>.
            </p>
            <p>
              The submission form takes <em>one link</em>, not four. Put
              the four files inside one folder, share the folder, paste
              the folder link.
            </p>
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-sm">
              <strong>Do not submit the mission brief itself.</strong> What
              you upload is the four documents <em>you</em> wrote — not the
              chapter brief from the dashboard. Some interns last cycle
              printed the brief to PDF and uploaded that. It earns zero
              marks because none of your deliverables are in it.
            </div>
          </Section>

          <Section icon={FileText} title="Stage 1 — what you submit and what gets marked">
            <p>
              Your Stage 1 capstone is <strong>four documents</strong> — D1 to
              D4 — in one Google Drive folder. The desk tasks on the mission
              board (decrypt the ciphertext, identify the cipher, audit the
              JWTs) are the lab work; you fold what you find into these four.
            </p>
            <div className="p-3 rounded-lg bg-blue/5 border border-blue/20 text-sm text-foreground">
              Each document is graded as its own rubric section.{" "}
              <strong>A missing document is a zero for that section</strong> — not
              a small deduction. Submit all four.
            </div>

            <div className="space-y-3">
              <Deliverable
                code="D1"
                title="Crypto failure mapping"
                put="Every cryptographic failure in The Griot's artefacts — key-and-IV left in config, the reused IV, the five-character HS256 secret, and the three JWT failures (alg / lifecycle / privilege). Open with two or three sentences on hash vs encryption, using the Griot's own choices as the example."
                marked="Each finding cited to the specific evidence-pack file AND one external standard by section number (RFC / NIST SP / FIPS). A finding with no citation scores zero."
              />
              <Deliverable
                code="D2"
                title="Decoded artefact appendix"
                put="The recovered plaintext for each artefact, the method you used, and every intermediate output where a file has layers: AES plaintext + your recipe, the classical-cipher plaintext, a three-row JWT table, and the layered memo peeled base64 → ROT13 → substitution."
                marked="Show your working. Plaintext alone is not enough — the method and the intermediate layers are where the marks are."
              />
              <Deliverable
                code="D3"
                title="Five controls the board should approve"
                put="Five concrete controls — products, policies, or configurations — with one short justification each. Assume a small team and a tight budget."
                marked="Each control maps to at least two failures from D1 and is specific enough to build or buy. “Improve crypto hygiene” scores zero."
              />
              <Deliverable
                code="D4"
                title="Ethics stance — the Ethnos Cyber call"
                put="300–500 words, your own writing: a sponsor contact at Ethnos Cyber asks you to forward your findings privately before the Sankofa board sees them. Cover who you consult, what you will and won't share, how you weigh loyalty to the sponsor against Sankofa, and one action you take regardless."
                marked="Your judgment, not a “right answer” — plus a cited ISC2 Code of Ethics canon (by number). This is the document graders scan hardest for AI patterns."
              />
            </div>
          </Section>

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
                <Download className="h-4 w-4" /> Template — .docx (editable)
              </a>
              <a
                href="/capstone/stage-1/stage-1-capstone-template.pdf"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue/40 bg-white text-blue text-sm font-semibold hover:bg-blue/10"
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
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
              <strong>Already submitted the six separate documents?</strong>{" "}
              That&apos;s still accepted — you don&apos;t need to resubmit or use
              this template. See &ldquo;I already submitted six separate
              documents&rdquo; below.
            </div>
          </Section>

          <Section
            icon={FileText}
            title="File names — exact format"
          >
            <p>Name each file using this pattern:</p>
            <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg font-mono leading-relaxed overflow-x-auto">
              {`D1-Crypto-Failure-Mapping-<YourLastName>.docx
D2-Decoded-Artefact-Appendix-<YourLastName>.docx
D3-Five-Controls-<YourLastName>.docx
D4-Ethics-Stance-<YourLastName>.docx`}
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
              <strong>Why this changed:</strong> the Stage 1 graders read
              on web, mobile, and the occasional iPad. Google Docs renders
              the same on all three. PDFs, surprisingly, do not. So we
              switched.
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
                (D1 / D2 / D3 / D4), the stage label, and the date.
              </li>
              <li>
                <strong>Page numbers</strong> on every page. Footer or
                header — your choice.
              </li>
              <li>
                <strong>Citations to the evidence pack.</strong> When you
                quote a ciphertext, a JWT claim, or a decoded line, cite the
                file and where it came from, e.g.{" "}
                <code>02-classical-cipher.txt:8</code> or{" "}
                <code>03-jwts.txt: Token B header</code>. Verbatim quotes
                only — no paraphrasing.
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
                Recommendations are concrete. "Improve crypto hygiene" is
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
                Submitting fewer than the four deliverables. Each missing
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

          <Section icon={HelpCircle} title="The other questions we keep getting">
            <Q q="I already submitted six separate documents (the older task list). Is that a problem?">
              No — that&apos;s fully accepted and you do <strong>not</strong>{" "}
              need to resubmit. The six task documents (decryption walkthrough,
              classical cipher, JWT audit, hash-vs-encryption memo, controls, and
              ethics stance) cover exactly the same four graded areas (D1–D4).
              Graders mark the coverage of those four areas, not the number of
              files. The four-document template just organises the same work for
              everyone submitting from here on.
            </Q>
            <Q q="Can I work with another intern?">
              No. Every deliverable must be your own writing. You can
              discuss the brief in Slack and you can ask mentors questions
              — but the words in your Doc have to be yours. Identical
              passages across two interns get both submissions flagged.
            </Q>
            <Q q="My Drive folder name has my name. Is that OK?">
              Yes. The folder name doesn't matter — only the file names
              inside it do (D1-Evidence-Table-Surname.pdf etc.).
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
              <StoryChapter
                num={1}
                title="Stage 0 · Induction at the Gate"
                where="SOC Bench · Floor 4 — Sankofa Digital HQ, Lagos"
                summary={
                  "Amaka handed you the Q2 case file. A Tier-1 analyst had read one ticket, written 'probably nothing', and closed it. You had to tell her whether she was right to be worried."
                }
                cliffhanger={STAGE_STORIES["stage-0"].cliffhanger}
              />
              <StoryChapter
                num={2}
                title="Stage 1 · Ciphers & Secrets — you are here"
                where="Cryptography Lab · Floor 6"
                summary={
                  STAGE_STORIES["stage-1"].previously ??
                  "Your D2 dismissal-pattern walkthrough drove the SOC restructure. The board funded this chapter's emergency cryptography audit on the strength of your report."
                }
                cliffhanger={STAGE_STORIES["stage-1"].cliffhanger}
                isCurrent
              />
              <StoryChapter
                num={3}
                title="Stage 2 · The Attack Surface — next"
                where="Engineering War Room · Floor 5"
                summary={
                  STAGE_STORIES["stage-2"].previously ??
                  "One file from your Stage 1 work named a door — /legacy-admin/, a 2019 Django app that should have died two years ago. Chapter 3 is the war room. Bayo will not enjoy the conversation."
                }
                cliffhanger={STAGE_STORIES["stage-2"].cliffhanger}
                isLocked
              />
            </div>

            <p className="text-xs text-muted-foreground italic mt-2">
              Chapters 4 (Inside the Walls · DFIR) and 5 (The Debrief ·
              The Boardroom) wait beyond that — but no spoilers. Clear
              this stage to unlock the next.
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
            ? "border-border bg-slate-50 opacity-80"
            : "border-border bg-white"
      }`}
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
            isCurrent
              ? "bg-blue text-white"
              : isLocked
                ? "bg-slate-200 text-slate-600"
                : "bg-emerald-100 text-emerald-800"
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
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
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
  put,
  marked,
}: {
  code: string;
  title: string;
  put: string;
  marked: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center gap-2.5 mb-2.5">
        <span className="inline-flex items-center justify-center shrink-0 w-9 h-7 rounded-md bg-blue/10 text-blue text-xs font-bold font-mono">
          {code}
        </span>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <div className="space-y-1.5 text-sm leading-relaxed">
        <p>
          <span className="font-semibold text-foreground">Put in it:</span>{" "}
          <span className="text-foreground/80">{put}</span>
        </p>
        <p>
          <span className="font-semibold text-foreground">Marked on:</span>{" "}
          <span className="text-foreground/80">{marked}</span>
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
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-blue/10 text-blue border-blue/30";
  return (
    <section className="mb-8 bg-white border border-border rounded-2xl p-6 shadow-sm transition-shadow hover:shadow-md">
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
