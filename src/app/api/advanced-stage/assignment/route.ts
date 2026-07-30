import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { advancedVariantFor } from "@/lib/advanced-variant";
import { advancedTrackLabel, getAdvancedProject, isAdvancedStage } from "@/lib/advanced-stage";
import { renderMarkdownPdf } from "@/lib/advanced-doc-pdf";
import { stageRank } from "@/lib/stage-login";
import { resolvedInternCode } from "@/lib/intern-code";
import { stageWindowAcceptsSubmissions } from "@/lib/stage-window";

function overlayFor(stage: string, track: string, pool: number): string[] {
  const common = [
    "Use the shared Stage base artifact issued to your track.",
    `Your private assignment set is D${pool}; this label does not change the shared artifact bytes.`,
    "The assigned marker must appear in setup evidence, the evidence index, and the integrity attestation.",
    "Where this overlay differs from the public base pack, this overlay controls.",
  ];

  const overlays: Record<string, string[]> = {
    "STAGE_5:GRC": [
      `Board implementation capacity is ${[720, 780, 840, 900, 960, 1020][pool - 1]} staff-hours.`,
      `Your third control must be operational by ${["30 Sep", "15 Oct", "31 Oct", "15 Nov", "30 Nov", "15 Dec"][pool - 1]} 2026; record dependencies if that is infeasible.`,
    ],
    "STAGE_6:GRC": [
      `The planned launch date is ${["17", "18", "20", "22", "24", "27"][pool - 1]} July 2026.`,
      `Risk acceptance above USD ${[25, 40, 55, 70, 85, 100][pool - 1]},000 requires CEO approval.`,
    ],
    "STAGE_6:ETHICAL_HACKING": [
      "Before building B2, export `UBI_STAGE6_MARKER` with the exact evidence marker printed above, then run `vagrant up vulnerable patched`.",
      "If you already built B1, copy B2 `lab-source/install-assigned-flags.sh` into the existing B1 `lab-source/` directory and follow the B1 migration commands in `lab-source/README.md`.",
      "B1 UID-0 evidence captured before the correction remains valid; missing B1 flags are not penalized.",
    ],
    "STAGE_7:GRC": [
      `Your audit sample must expand one of these controls: ${["A.5.16", "A.5.18", "A.5.19", "A.8.5", "A.8.8", "A.8.32"][pool - 1]}.`,
      "Add two evidence requests for that control and state the sampling rationale.",
    ],
    "STAGE_8:GRC": [
      `The treatment budget is USD ${[45, 55, 65, 75, 85, 95][pool - 1]},000.`,
      `Use annual-loss ranges with a ${[10, 15, 20, 25, 30, 35][pool - 1]}% uncertainty sensitivity test.`,
    ],
    "STAGE_9:GRC": [
      `Replace the baseline awareness time with 13 July 2026 ${["07:35", "08:05", "08:35", "09:05", "09:35", "10:05"][pool - 1]} WAT.`,
      `Add ${[0, 12, 24, 36, 48, 60][pool - 1]} unique California subjects to CA-A before threshold and deadline analysis.`,
    ],
    "STAGE_7:SOC_ANALYSIS": [
      `Use the address-plan second octet ${[51, 61, 71, 81, 91, 101][pool - 1]}.`,
      "The management VLAN may initiate administration; no other zone may initiate management sessions.",
      [
        "D1 condition: make the finance-zone return path asymmetric through the core and prove the stateful failure before repairing it.",
        "D2 condition: remove DMZ-to-server traffic from the sensor mirror and prove the visibility gap before repairing it.",
        "D3 condition: broaden the management source by one CIDR boundary, catch the unauthorized path in tests, then repair it.",
        "D4 condition: break only UDP DNS return-state handling, preserve TCP DNS, and diagnose the policy defect from packets and counters.",
        "D5 condition: move source NAT ahead of telemetry attribution, prove the identity loss, then restore correct ordering.",
        "D6 condition: inject a more-specific engineering route toward the wrong gateway, prove the path selection, then repair it.",
      ][pool - 1],
    ],
    "STAGE_8:SOC_ANALYSIS": [
      `For the recorded defense, prepare matrix row ${pool}. The panel may assign any row live.`,
    ],
    "STAGE_7:ETHICAL_HACKING": [
      `Use AWS region ${["us-east-1", "us-east-2", "us-west-2", "eu-west-1", "eu-central-1", "af-south-1"][pool - 1]} unless CloudGoat reports scenario incompatibility; document any approved change.`,
    ],
    "STAGE_8:ETHICAL_HACKING": [
      "GOAD-Light is your scored baseline. Full GOAD is not required unless separately issued as a pressure task.",
    ],
  };

  return [...common, ...(overlays[`${stage}:${track}`] ?? ["Use your private marker and assignment set with the shared track artifact."])];
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  // This link is always opened as a direct browser navigation (target=
  // _blank), never a fetch/XHR call. A bare 401 JSON body just shows up as
  // unreadable text in a new tab with no way back — an expired hour-long
  // session reads to the intern as "the download is broken." Redirect to
  // login with a return path instead.
  if (!session) {
    const next = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(new URL(`/login?next=${next}`, request.url));
  }

  const stage = request.nextUrl.searchParams.get("stage")?.toUpperCase() ?? "";
  if (!isAdvancedStage(stage)) {
    return Response.json({ error: "Invalid advanced stage" }, { status: 400 });
  }

  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
    select: { id: true, currentStage: true, track: true, isActive: true },
  });
  if (!intern?.isActive) return Response.json({ error: "Intern profile not found" }, { status: 404 });
  if (stageRank(stage) > stageRank(intern.currentStage)) {
    return Response.json({ error: "Stage not reached" }, { status: 403 });
  }

  const window = await prisma.stageWindow.findUnique({ where: { stage } });
  if (!stageWindowAcceptsSubmissions(window)) {
    return Response.json({ error: "Stage is not open" }, { status: 403 });
  }

  const project = getAdvancedProject(stage, intern.track);
  if (!project) return Response.json({ error: "Track project not found" }, { status: 404 });

  const publicApp = await prisma.publicApplication.findFirst({
    where: { email: session.email.toLowerCase() },
    select: { internId: true },
  });
  const internCode = resolvedInternCode(publicApp?.internId);
  const fallbackVariant = advancedVariantFor(intern.id, internCode, stage);
  const artifact = await prisma.advancedArtifactGrant.findUnique({
    where: { internId_stage: { internId: intern.id, stage } },
    select: {
      track: true,
      variant: true,
      marker: true,
      fileName: true,
      sha256: true,
      manifestSignature: true,
      sizeBytes: true,
      expiresAt: true,
      revokedAt: true,
    },
  });
  const validArtifact =
    artifact &&
    !artifact.revokedAt &&
    artifact.track === intern.track &&
    (!artifact.expiresAt || artifact.expiresAt.getTime() > Date.now())
      ? artifact
      : null;
  const variant = validArtifact
    ? { cohort: "ADV-C1", variant: validArtifact.variant, marker: validArtifact.marker }
    : fallbackVariant;
  const parsedPool = Number(variant.variant.slice(1));
  const pool = Number.isInteger(parsedPool) && parsedPool >= 1 && parsedPool <= 6 ? parsedPool : 1;
  const lines = [
    `# ${project.title} - Private Assignment Overlay`,
    "",
    `Intern: ${internCode}`,
    `Track: ${intern.track}`,
    "Base artifact: shared track release",
    `Private assignment set: D${pool}`,
    `Evidence marker: ${variant.marker}`,
    "",
    "## Assigned evidence archive",
    "",
    ...(validArtifact
      ? [
          `- Filename: ${validArtifact.fileName}`,
          `- Bytes: ${validArtifact.sizeBytes}`,
          `- SHA-256: ${validArtifact.sha256}`,
          `- Manifest signature: ${validArtifact.manifestSignature}`,
          `- Download expiry: ${validArtifact.expiresAt?.toISOString() ?? "stage window closure"}`,
        ]
      : ["- The private evidence archive has not been issued. Do not begin from another candidate's pack."]),
    "",
    "## Controlling assignment facts",
    "",
    ...overlayFor(stage, intern.track, pool).map((line) => `- ${line}`),
    ...(stage === "STAGE_5" && intern.track === "SOC_ANALYSIS"
      ? [
          "",
          "## Required discrepancy file",
          "",
          "Download `/api/advanced-stage/discrepancy?stage=STAGE_5` while signed in.",
          "It assigns 96 review candidates. Exactly 80 have a valid evidence-backed benign explanation; the other 16 must be escalated.",
        ]
      : []),
    ...(stage === "STAGE_5" && intern.track === "ETHICAL_HACKING"
      ? [
          "",
          "## Local target startup",
          "",
          "Extract the shared archive and run `python3 local_lab.py --marker " + variant.marker + " --output lab-runtime`.",
          "The target binds only to 127.0.0.1 and writes the controlling scope file into `lab-runtime/`.",
        ]
      : []),
    "",
    "Do not share this overlay during the assessment window.",
    "",
  ];

  // Content/logic above is unchanged — only the file format changes, from
  // raw markdown to a designed PDF, so this is something an intern is
  // actually meant to read rather than a plain-text export.
  const markdown = lines.join("\n");
  const firstLine = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? `${project.title} — Private Assignment Overlay`;
  const body = markdown.replace(/^#\s+.+\n/, "");
  const pdf = await renderMarkdownPdf({
    eyebrow: `${advancedTrackLabel(intern.track)} / ${stage.replace("_", " ")} · Private overlay`,
    title: firstLine,
    markdown: body,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${stage.toLowerCase()}-${internCode}-assignment.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
