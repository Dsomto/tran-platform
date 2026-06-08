import { requireAuth } from "@/lib/auth";
import { Topbar } from "@/components/dashboard/topbar";
import {
  FileText,
  Folder,
  CheckCircle2,
  ShieldAlert,
  HelpCircle,
  FileSignature,
} from "lucide-react";

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
              mission board. You upload them to a Google Drive folder, then
              paste the folder link into the submission form on{" "}
              <code className="text-foreground">/dashboard/reports</code>.
            </p>
            <p>
              The submission form takes <em>one link</em>, not four. Put the
              four files inside one folder, share the folder, paste the
              folder link.
            </p>
          </Section>

          <Section
            icon={FileText}
            title="File names — exact format"
          >
            <p>
              Name each file using this pattern:
            </p>
            <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg font-mono leading-relaxed overflow-x-auto">
              {`D1-Evidence-Table-<YourLastName>.pdf
D2-Dismissal-Pattern-<YourLastName>.pdf
D3-Business-Impact-<YourLastName>.pdf
D4-Judgment-Essay-<YourLastName>.pdf`}
            </pre>
            <ul className="list-disc pl-5 space-y-1">
              <li>No spaces in the file name. Use dashes.</li>
              <li>Your last name exactly as it appears on your acceptance email.</li>
              <li>Same pattern across stages — only the deliverable codes change per brief.</li>
            </ul>
          </Section>

          <Section
            icon={FileSignature}
            title="Format — PDF, every time"
          >
            <p>
              Submit as <strong>PDF</strong>. Not .docx, not .pages, not
              .txt, not Google Doc share links inside the folder.
            </p>
            <p>
              If you write in Word or Google Docs, export to PDF before
              uploading. The graders read on whatever device they happen to
              have open; PDF is the only format that renders the same for
              everyone.
            </p>
            <p className="text-sm text-muted-foreground">
              Exception: if a specific deliverable explicitly asks for a
              spreadsheet (e.g. an evidence table you keep editing), the
              brief will say so. Default is PDF.
            </p>
          </Section>

          <Section
            icon={CheckCircle2}
            title="Every PDF must include"
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
                quote a log line or a ticket disposition, cite the file
                and the line number, e.g. <code>auth-log-q2.txt:14</code>
                or <code>tier-1-ticket-history.csv: SD-40812</code>.
                Verbatim quotes only — no paraphrasing the disposition
                column.
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

          <p className="mt-10 text-sm text-muted-foreground text-center">
            One sentence to remember:{" "}
            <strong className="text-foreground">
              cite the line, name the number, ship the PDF, share every file.
            </strong>
          </p>
        </div>
      </div>
    </>
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
