import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ReportEditor } from "./report-editor";

const STAGE_META: Record<
  string,
  { label: string; subtitle: string; storyline: string; sections: string[] }
> = {
  STAGE_0: {
    label: "Stage 0",
    subtitle: "Foundations",
    storyline:
      "You are writing to the Sankofa Digital incident committee. Summarise what you observed across the foundation scenarios and what it implies for how their SOC should operate day-to-day.",
    sections: [
      "Observations from the foundation exercises",
      "What these exercises told you about the SOC's current posture",
      "Recommended next steps",
    ],
  },
  STAGE_1: {
    label: "Stage 1",
    subtitle: "Applied Cryptography",
    storyline:
      "Addressed to Amaka Eze and the board — your analysis of the cryptographic failures that enabled The Griot to stay undetected, and the control set that would have prevented it.",
    sections: [
      "Cryptographic failures observed",
      "Why modern algorithms alone were not enough",
      "Controls Sankofa should adopt",
    ],
  },
  STAGE_2: {
    label: "Stage 2",
    subtitle: "Web Application Security",
    storyline:
      "A penetration-test-style finding report addressed to Sankofa's engineering leadership — reconstruct the web attack chain, score each finding, and recommend remediation.",
    sections: [
      "Reconnaissance and initial entry",
      "The exploit chain (auth bypass → XSS → SSRF)",
      "Findings classification and severity",
      "Remediation plan",
    ],
  },
  STAGE_3: {
    label: "Stage 3",
    subtitle: "Incident Response",
    storyline:
      "A formal incident report addressed to Sankofa's CISO and legal team. Cover detection, containment, eradication, and the lessons learned.",
    sections: [
      "Incident timeline",
      "Containment and eradication actions",
      "Root cause analysis",
      "Lessons learned and policy changes",
    ],
  },
  STAGE_4: {
    label: "Stage 4",
    subtitle: "Governance & Risk",
    storyline:
      "Addressed to the Sankofa board and the regulator. Translate the technical findings into governance language and risk decisions.",
    sections: [
      "Risk register entries arising from this incident",
      "Control gaps against your chosen framework",
      "Board-level recommendations",
    ],
  },
};

export default async function ReportEditorPage({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const session = await requireAuth();
  const { stage: stageSlug } = await params;
  const stage = stageSlug.toUpperCase();

  if (!STAGE_META[stage]) {
    notFound();
  }

  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
  });
  if (!intern) redirect("/dashboard");

  const [existing, window] = await Promise.all([
    prisma.stageReport.findUnique({
      where: { internId_stage: { internId: intern.id, stage: stage as never } },
    }),
    prisma.stageWindow.findUnique({ where: { stage: stage as never } }),
  ]);

  const meta = STAGE_META[stage];
  const now = new Date();
  const isOpen = window ? now >= window.activeFrom && now <= window.submitUntil : true;
  const isPassed = existing?.status === "PASSED";

  // Server-side gate: if the admin hasn't opened this stage, the intern
  // can't see the report editor — even if they guess the URL.
  const isLocked = window ? window.isLocked : true;
  if (isLocked) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto mt-16 bg-white border border-border rounded-xl p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 grid place-items-center">
            <Lock className="w-5 h-5 text-slate-600" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-1">
            {meta.label} is not open yet
          </h1>
          <p className="text-sm text-muted-foreground mb-5">
            The programme team has not opened {meta.label} for this cohort.
            You will get an email and a pinned announcement as soon as it opens.
          </p>
          <Link
            href="/dashboard/assignments"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-foreground text-background hover:opacity-90"
          >
            Back to stages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ReportEditor
      stage={stage}
      stageLabel={meta.label}
      stageSubtitle={meta.subtitle}
      storyline={meta.storyline}
      sectionHints={meta.sections}
      initialReport={
        existing
          ? {
              id: existing.id,
              executiveSummary: existing.executiveSummary,
              reportUrl: existing.reportUrl,
              attachmentUrl: existing.attachmentUrl,
              status: existing.status,
              version: existing.version,
              score: existing.score,
              feedback: existing.feedback,
              submittedAt: existing.submittedAt ? existing.submittedAt.toISOString() : null,
            }
          : null
      }
      windowInfo={
        window
          ? {
              activeFrom: window.activeFrom.toISOString(),
              submitUntil: window.submitUntil.toISOString(),
              passingScore: window.passingScore,
              isOpen,
            }
          : null
      }
      locked={isPassed || !isOpen}
    />
  );
}
