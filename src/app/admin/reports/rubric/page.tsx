import { requireGrader } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

// ── Master grading rubric shown in the grader portal. This is the standard
// every grader applies across stages; the per-stage PDF marking guides on each
// report carry the stage-specific answer keys and decoys. Content is
// methodology only (no intern data), safe to ship. ──

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 mb-4">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

function Band({ range, label, tone, children }: { range: string; label: string; tone: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 items-start">
      <div className={`shrink-0 w-20 text-center rounded-lg px-2 py-1 text-sm font-bold ${tone}`}>{range}</div>
      <div>
        <span className="font-semibold text-foreground">{label}. </span>
        <span className="text-foreground/90">{children}</span>
      </div>
    </div>
  );
}

function Rule({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="font-semibold text-foreground mb-1">{title}</p>
      <p className="text-sm text-foreground/85 leading-relaxed">{children}</p>
    </div>
  );
}

const STAGE_TABLE = [
  { stage: "Stage 0", name: "Foundations", deliverables: "D1–D2 + desk writeups", guide: "/grading/006fdacc-d42b-491c-bb29-8e2f74015fbb/stage-0-marking-guide.pdf" },
  { stage: "Stage 2", name: "Web Application Security", deliverables: "D1–D4, 120 pts", guide: "/grading/f94119af-0265-4b32-983f-0cbdff2596bc/stage-2-marking-guide.pdf" },
  { stage: "Stage 3", name: "Incident Response", deliverables: "D1–D5, 120 pts", guide: "/grading/79417183-0b45-48c1-a38a-29ba2dcf5a8f/stage-3-marking-guide.pdf" },
];

export default async function GradingRubricPage() {
  await requireGrader();

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-10">
      <header>
        <Link href="/admin/reports" className="text-sm text-blue hover:underline">← Back to grading queue</Link>
        <h1 className="text-3xl font-bold text-foreground mt-3">Grading Rubric &amp; Standard</h1>
        <p className="text-muted mt-2 max-w-2xl">
          The shared standard every grader applies. Keep this open while you grade. The stage-specific
          answer keys, evidence pack, and decoys live in each report&apos;s marking guide; this page is
          the methodology, the score bands, the integrity rules, and the feedback standard that sit on
          top of them.
        </p>
      </header>

      {/* Quick nav */}
      <nav className="rounded-xl border border-border bg-surface p-4 text-sm">
        <p className="font-semibold text-foreground mb-2">On this page</p>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-blue">
          {[
            ["the-standard", "1. The standard we hold"],
            ["workflow", "2. How to grade a report"],
            ["scoring", "3. Scoring model & conversion"],
            ["bands", "4. Score bands (0–100)"],
            ["principles", "5. Core principles"],
            ["deliverables", "6. Per-deliverable criteria"],
            ["feedback", "7. The feedback standard"],
            ["integrity", "8. Integrity & AI-use"],
            ["divergence", "9. Two-grader model & divergence"],
            ["example", "10. Worked example"],
            ["stages", "11. Per-stage quick reference"],
            ["checklist", "12. Do / Don't checklist"],
          ].map(([id, label]) => (
            <li key={id}><a href={`#${id}`} className="hover:underline">{label}</a></li>
          ))}
        </ul>
      </nav>

      <Section id="the-standard" title="1. The standard we hold">
        <p>
          This cohort is held to a standard of <strong>excellence</strong>. Your job is not to be kind
          and not to be harsh: it is to score exactly where the evidence lands. Reserve the 80s for work
          that genuinely approaches an excellent answer, and 90+ for work that is essentially the model
          answer. A submission that is merely present, partial, or that asserts findings without quoting
          the line that proves them is a middling-to-low score, not a pass by default.
        </p>
        <p>
          You are an assessor and a mentor in one. Grade to the bar honestly, then write feedback that
          shows the intern exactly how to reach it. Both halves matter equally.
        </p>
      </Section>

      <Section id="workflow" title="2. How to grade a report">
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>Open the report folder and read every deliverable in full before scoring anything.</li>
          <li>Open the stage marking guide (PDF on the report) and the evidence pack in tabs.</li>
          <li>Score each deliverable against its answer key, <strong>verifying every claim against the actual evidence files</strong>, not memory and not the key alone.</li>
          <li>Sum the raw points, apply any fabrication penalty, and convert to a percentage (see §3).</li>
          <li>Write constructive, specific feedback (see §7).</li>
          <li>If you cannot read the submission, set it to cannot-assess and flag for senior review rather than scoring it low (see §5).</li>
        </ol>
        <p className="text-sm text-muted">
          The cutoff is applied later by the programme office, not by you. Never round a score to clear a
          cutoff you think exists. Score the work; the cutoff is a separate, audited step.
        </p>
      </Section>

      <Section id="scoring" title="3. Scoring model & conversion">
        <p>
          Capstones are scored out of <strong>120 raw points</strong> split across the deliverables, then
          converted to a 0–100 percentage:
        </p>
        <pre className="rounded-lg bg-surface border border-border p-4 text-sm overflow-x-auto">
{`rawPoints   = sum of deliverable scores (max 120)
reportScore = round(rawPoints / 120 * 100) - fabricationPenalty   (clamped 0–100)`}
        </pre>
        <p>
          Round half up. The fabrication penalty is a flat deduction (see §5), applied once, after the
          conversion. The deliverable split is stated in each stage&apos;s marking guide; see §11 for the
          shape of each stage.
        </p>
      </Section>

      <Section id="bands" title="4. Score bands (0–100)">
        <p className="text-sm text-muted">Calibrate to these. Do not round a borderline up to the next band.</p>
        <div className="space-y-3 mt-2">
          <Band range="90–100" label="Near-model" tone="bg-emerald-100 text-emerald-800">
            The full chain reconstructed, every claim tied to a quoted evidence line, precise and correct
            sub-technique IDs, all decoys explicitly ruled out, a correct and actionable root cause and
            remediation. Reserve this for work you would hand a client unedited.
          </Band>
          <Band range="80–89" label="Strong" tone="bg-emerald-50 text-emerald-700">
            Approaches excellence with real evidence discipline, but has a few gaps: a missing finding,
            a loose technique ID, or a decoy handled implicitly rather than stated.
          </Band>
          <Band range="70–79" label="Solid" tone="bg-blue-50 text-blue-700">
            A genuine, defensible reconstruction with the core findings proven, but noticeably incomplete
            or uneven across deliverables.
          </Band>
          <Band range="60–69" label="Below the bar" tone="bg-amber-50 text-amber-800">
            Real effort and some correct findings, but key parts of the chain are missing, asserted without
            proof, or wrong. Do not inflate these into a pass.
          </Band>
          <Band range="40–59" label="Partial" tone="bg-orange-50 text-orange-800">
            Fragments of the right answer; large sections absent or unproven; weak evidence discipline.
          </Band>
          <Band range="0–39" label="Minimal" tone="bg-rose-50 text-rose-700">
            Mostly absent, off-topic, fabricated, or only one deliverable submitted.
          </Band>
        </div>
      </Section>

      <Section id="principles" title="5. Core principles">
        <Rule title="Proof beats the label">
          A finding stated with no supporting evidence line scores 0 for that row, even if the conclusion
          happens to be correct. Credit a correct finding written in prose; do not credit a correct-sounding
          label with nothing behind it.
        </Rule>
        <Rule title="Verify against the evidence, not memory">
          The answer key is a guide, not the ground truth. Open the evidence files and confirm the intern&apos;s
          quoted lines, PIDs, timestamps, IPs, and values actually appear there. Many disputes come from a
          grader trusting the key over the file.
        </Rule>
        <Rule title="Fabrication: row 0 + flat 5-point penalty">
          Fabrication is inventing an evidence line, value, hash, count, or technique ID the evidence does
          not support; claiming a planted decoy as a real finding; or labelling benign infrastructure as
          malicious. Zero that row and apply a flat 5-point penalty to the final score, named plainly and
          kindly in the feedback. Never round a fabricator up. Mentioning context that genuinely appears in
          the evidence is <em>not</em> fabrication; an honest misread of a real artefact is a scoring error,
          not a penalty.
        </Rule>
        <Rule title="Decoy discipline">
          Each stage plants traps (a junk payload, benign infra, an invented lateral-movement path). Do not
          reward an intern for claiming them; <strong>do</strong> reward an intern who explicitly rules them
          out. The specific decoys are listed in the stage marking guide.
        </Rule>
        <Rule title="Fair, not lenient">
          Credit a correct finding in prose, and accept a defensible neighbouring technique ID when the
          evidence line is right. But do not give the benefit of the doubt to a thin or unproven row, and do
          not round a borderline up. Score where the evidence genuinely lands and let the feedback show the
          way up.
        </Rule>
        <Rule title="Read reliability → cannot-assess, not a low score">
          If you cannot open the submission (broken link, OneDrive wall, metadata-only export, empty folder),
          set it to cannot-assess and flag it for senior review with the reason. A partial read is
          cannot-assess, not a 20. Never guess a score for work you could not read.
        </Rule>
      </Section>

      <Section id="deliverables" title="6. Per-deliverable criteria">
        <p className="text-sm text-muted">
          Generic guidance for the common deliverable types. The exact points and answers are in the stage
          guide.
        </p>
        <div className="space-y-3 mt-2">
          <Rule title="Process / artefact triage">
            Full marks: the correct top suspects named, each with the verbatim process line or artefact and
            its identifier (PID/path), a false-positive ruling per item, and the planted benign items
            explicitly cleared. Lose marks for paraphrased evidence, missing identifiers, or no FP reasoning.
          </Rule>
          <Rule title="Timeline">
            Full marks: the whole chain in order — initial access through to the final action (exfiltration /
            impact) — every row tied to at least one source line, with the decoys ruled out in prose. Lose
            marks for a truncated chain, unsourced rows, or wrong attribution.
          </Rule>
          <Rule title="IOC / indicator list">
            Full marks: deduplicated, provenance-tagged indicators across all relevant categories, confidence
            where appropriate, and the benign/junk decoys deliberately excluded. Lose marks for missing core
            indicators, listing benign infra, or no provenance.
          </Rule>
          <Rule title="Technique / ATT&CK mapping">
            Full marks: specific sub-technique IDs that match the observed behaviour, each tied to a proving
            evidence line, covering every phase. Accept a defensible neighbouring ID when the line is right.
            Lose marks for parent-only IDs, missing phases, or IDs the evidence does not support (the latter
            is fabrication).
          </Rule>
          <Rule title="Formal report / writeup">
            Full marks: a correct and actionable root cause (the actual mechanism, not &quot;malware ran&quot;),
            the real impact named, complete and correctly-ordered containment and eradication, and a clear,
            jargon-free executive summary. Lose marks for a wrong/vague root cause, missed impact, or
            generic remediation.
          </Rule>
        </div>
      </Section>

      <Section id="feedback" title="7. The feedback standard">
        <p>Feedback is mandatory and is held to the same bar as the score. Every piece of feedback should:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Open with genuine strength.</strong> Name what they actually did well, specifically.</li>
          <li><strong>Turn every gap into a next step.</strong> For each weakness, show the stronger move: the exact line to quote, the technique ID that fits, or the sentence that earns the marks. Not &quot;timeline incomplete&quot; but &quot;add the exfiltration row: quote the scp line at 03:01:18&quot;.</li>
          <li><strong>Be specific.</strong> Reference PIDs, timestamps, IPs, technique IDs, and section names. Vague feedback is not useful and is not acceptable.</li>
          <li><strong>Acknowledge decoy handling.</strong> Praise it when they ruled a decoy out; name it plainly and kindly when they fell for one.</li>
          <li><strong>End with the single most important next step,</strong> phrased as encouragement, so they leave knowing exactly what to fix and believing it is reachable.</li>
          <li><strong>Be long enough to mentor:</strong> roughly 9–13 sentences, deliverable by deliverable.</li>
          <li><strong>Sound human.</strong> A real analyst&apos;s voice, not an AI checklist. <strong>No em dashes.</strong> No PII beyond the intern&apos;s own first name.</li>
        </ul>
      </Section>

      <Section id="integrity" title="8. Integrity & AI-use">
        <p>
          Watch for and flag (do not silently fail): submissions that are byte-identical or near-identical to
          another intern&apos;s; an answer that solves a different incident than the one in the evidence (a
          recycled template); confident prose with zero citations; and AI-tell patterns such as invented but
          plausible-sounding evidence lines that do not exist in the files. Invented evidence is fabrication
          (§5). When two submissions match, flag both for senior review.
        </p>
      </Section>

      <Section id="divergence" title="9. Two-grader model & divergence">
        <p>
          Each capstone is graded independently by two graders. Grade your slot without looking for the other
          score. When the two scores diverge beyond the threshold, the report is marked divergent and a senior
          runs a tiebreak. Pending results are QA-verified before they are finalised. Your job is an honest,
          independent read; the system reconciles.
        </p>
      </Section>

      <Section id="example" title="10. Worked example (one deliverable)">
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3 text-sm">
          <p>
            <strong>Submission (timeline row):</strong> &quot;Attacker escalated privileges using sudo.&quot;
          </p>
          <p>
            <strong>Scoring:</strong> the conclusion is in the right area but there is no proving line and the
            mechanism is unnamed, so this row earns partial credit at most. If the intern had written
            &quot;privilege escalation via the NOPASSWD sudo entry on a GTFOBins binary (quote the sudoers line
            and the sudo log line)&quot;, it would earn full credit.
          </p>
          <p>
            <strong>Feedback:</strong> &quot;You spotted the escalation, which is the right instinct. To earn the
            marks, name the mechanism and quote the proof: the sudoers drop-in grants NOPASSWD on a
            file-reading binary, and because that binary is a GTFOBins shell-escape, it drops a root shell.
            Quote the sudoers line and the matching sudo log entry, and this row goes from partial to full.&quot;
          </p>
        </div>
      </Section>

      <Section id="stages" title="11. Per-stage quick reference">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="py-2 pr-4 font-medium">Stage</th>
                <th className="py-2 px-3 font-medium">Focus</th>
                <th className="py-2 px-3 font-medium">Deliverables</th>
                <th className="py-2 pl-3 font-medium">Marking guide</th>
              </tr>
            </thead>
            <tbody>
              {STAGE_TABLE.map((s) => (
                <tr key={s.stage} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium text-foreground">{s.stage}</td>
                  <td className="py-2 px-3">{s.name}</td>
                  <td className="py-2 px-3">{s.deliverables}</td>
                  <td className="py-2 pl-3">
                    <a href={s.guide} target="_blank" rel="noreferrer noopener" className="text-blue hover:underline">Open PDF →</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted mt-2">
          The per-stage guide is also linked in the &quot;Grading resources&quot; box on each report.
        </p>
      </Section>

      <Section id="checklist" title="12. Do / Don't checklist">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-semibold text-emerald-800 mb-2">Do</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-emerald-900/90">
              <li>Verify every claim against the evidence files.</li>
              <li>Score where the evidence lands; hold the excellence bar.</li>
              <li>Credit correct prose and defensible neighbouring IDs.</li>
              <li>Reward ruling out decoys.</li>
              <li>Write specific, mentoring feedback ending in one next step.</li>
              <li>Flag unreadable submissions as cannot-assess.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="font-semibold text-rose-800 mb-2">Don&apos;t</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-rose-900/90">
              <li>Round a borderline up to clear a cutoff.</li>
              <li>Reward a claim with no proving line.</li>
              <li>Reward claiming a decoy, or penalise ruling one out.</li>
              <li>Round a fabricator up; always apply the penalty.</li>
              <li>Give a low score for work you could not read.</li>
              <li>Use em dashes or AI-sounding, generic feedback.</li>
            </ul>
          </div>
        </div>
      </Section>
    </div>
  );
}
