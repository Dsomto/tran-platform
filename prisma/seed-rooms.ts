import { promises as fs } from "fs";
import path from "path";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

type StageSlug = "stage-0" | "stage-1" | "stage-2" | "stage-3" | "stage-4";

type Room = {
  slug: string;
  stage: "STAGE_0" | "STAGE_1" | "STAGE_2" | "STAGE_3" | "STAGE_4";
  order: number;
  title: string;
  codename: string;
  synopsis: string;
  briefing: string;
  debrief: string;
  learningObjectives: string;
  themeColor: string;
  totalPoints: number;
  passThreshold: number;
};

type TaskScenario = {
  order: number;
  title: string;
  description: string;
  maxPoints: number;
  kind: "FLAG" | "WRITEUP" | "UPLOAD" | "MULTIPLE_CHOICE";
  widget:
    | "NONE"
    | "WEB_TERMINAL"
    | "CIPHER_TOOLS"
    | "STEGO_VIEWER"
    | "LOG_VIEWER"
    | "VULN_APP_SIM"
    | "PORT_SCANNER"
    | "FILE_DOWNLOAD"
    | "DIAGRAM_UPLOAD"
    | "MCQ_QUIZ"
    | "WRITEUP_PAD";
  widgetConfig?: Record<string, unknown> | null;
  flagSalt?: string | null;
  choices?: string[] | null;
  correctIndex?: number | null;
  minWords?: number | null;
};

const ROOMS: Record<StageSlug, Room> = {
  "stage-0": {
    slug: "induction-at-the-gate",
    stage: "STAGE_0",
    order: 0,
    title: "Induction at the Gate",
    codename: "Operation Root Access — Chapter 1",
    synopsis:
      "Your first morning at Sankofa Digital. Meet Amaka, poke around the shell, and help triage a suspicious Q2 login.",
    briefing:
      "Welcome to Sankofa Digital. I'm Amaka Eze — Head of Security. You're on the Root Access programme; your first rotation is the SOC bench.\n\nSettle in. Learn the shell. Then open the auth log we pulled from Q2. Something doesn't sit right.",
    debrief:
      "That Q2 login — don't file it yet. Tunde thinks the adversary was already inside. We'll need to dust for crypto next room.",
    learningObjectives:
      "- CIA triad, AAA, threat taxonomy\n- Linux CLI basics (ls, cd, cat, grep, chmod, stat)\n- Hashing (SHA-256), base64 / hex\n- SIEM log reading\n- ISC2 Code of Ethics",
    themeColor: "#34d399",
    totalPoints: 100,
    passThreshold: 70,
  },
  "stage-1": {
    slug: "ciphers-and-secrets",
    stage: "STAGE_1",
    order: 1,
    title: "Ciphers & Secrets",
    codename: "Operation Root Access — Chapter 2",
    synopsis:
      "A zip of The Griot's staging-server files. Crypto badly applied. Peel back the layers.",
    briefing:
      "The Griot left breadcrumbs — encrypted but sloppy. Your job is to decrypt, verify, and document each mistake.",
    debrief:
      "Decrypted plaintext references sankofa.internal/legacy-admin/. That should have been killed last year. We're going perimeter next.",
    learningObjectives:
      "- Symmetric (AES-CBC / ECB / GCM), asymmetric (RSA)\n- Hashing vs encryption, HMAC, TLS + PKI\n- Digital signatures\n- Steganography, password hashes",
    themeColor: "#a78bfa",
    totalPoints: 120,
    passThreshold: 70,
  },
  "stage-2": {
    slug: "the-attack-surface",
    stage: "STAGE_2",
    order: 2,
    title: "The Attack Surface",
    codename: "Operation Root Access — Chapter 3",
    synopsis:
      "Map Sankofa's perimeter. Find the exposed admin panel. Reconstruct the OWASP exploit chain inside an embedded lab.",
    briefing:
      "Everything is simulated inside the browser. No real target gets touched. Your job: rebuild the attack step by step so we know exactly what The Griot did.",
    debrief:
      "Inside /legacy-admin/ you find session logs showing someone walked this path last quarter. The Griot is already in.",
    learningObjectives:
      "- TCP/IP, DNS, HTTP\n- OWASP Top 10 2021\n- Recon, dir enum, SQLi, XSS, SSRF, CSRF, JWT\n- CVE + CVSS, social engineering",
    themeColor: "#fb7185",
    totalPoints: 150,
    passThreshold: 70,
  },
  "stage-3": {
    slug: "inside-the-walls",
    stage: "STAGE_3",
    order: 3,
    title: "Inside the Walls",
    codename: "Operation Root Access — Chapter 4",
    synopsis:
      "You have a captured shell + memory snapshot + logs. Pivot, escalate, timeline the intrusion.",
    briefing:
      "The Griot is inside. We have artefacts from the compromised workstation — all simulated in-browser. Find the persistence. Map the lateral movement. Build the timeline.",
    debrief:
      "Now write it up for the board. This has to be presentable to non-technical eyes, legal, and auditors.",
    learningObjectives:
      "- Linux priv-esc, persistence\n- Memory + disk forensics intro\n- Log correlation, SIEM query basics\n- MITRE ATT&CK, IoC generation",
    themeColor: "#fbbf24",
    totalPoints: 180,
    passThreshold: 70,
  },
  "stage-4": {
    slug: "the-debrief",
    stage: "STAGE_4",
    order: 4,
    title: "The Debrief",
    codename: "Operation Root Access — Finale",
    synopsis:
      "Capstone. Brief Sankofa's board. Governance, compliance, architecture. Pick your track.",
    briefing:
      "Synthesise everything. You brief the board tomorrow. They don't care about TTPs — they care about dollars, law, and timeline.",
    debrief:
      "The Griot is named. Welcome to TRAN properly — pick your track. Week 6 you specialise.",
    learningObjectives:
      "- Defence-in-depth, zero trust (NIST 800-207)\n- NIST CSF 2.0, ISO 27001:2022\n- NDPR 2019 + NDPA 2023, GDPR\n- PICERL, risk assessment, BC/DR\n- SABSA / TOGAF basics, executive comms",
    themeColor: "#22d3ee",
    totalPoints: 250,
    passThreshold: 70,
  },
};

async function loadTasks(stage: StageSlug): Promise<TaskScenario[]> {
  const dir = path.join(process.cwd(), "prisma", "seed-rooms-scenarios", stage);
  let entries: string[] = [];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  const files = entries.filter((e) => e.endsWith(".json")).sort();
  const out: TaskScenario[] = [];
  for (const f of files) {
    const raw = await fs.readFile(path.join(dir, f), "utf8");
    out.push(JSON.parse(raw));
  }
  return out.sort((a, b) => a.order - b.order);
}

async function main() {
  for (const slug of Object.keys(ROOMS) as StageSlug[]) {
    const spec = ROOMS[slug];
    const tasks = await loadTasks(slug);
    const totalFromTasks = tasks.reduce((s, t) => s + t.maxPoints, 0);
    const totalPoints = totalFromTasks > 0 ? totalFromTasks : spec.totalPoints;

    const room = await prisma.room.upsert({
      where: { slug: spec.slug },
      create: {
        slug: spec.slug,
        stage: spec.stage,
        order: spec.order,
        title: spec.title,
        codename: spec.codename,
        synopsis: spec.synopsis,
        briefing: spec.briefing,
        debrief: spec.debrief,
        learningObjectives: spec.learningObjectives,
        themeColor: spec.themeColor,
        totalPoints,
        passThreshold: spec.passThreshold,
        isPublished: true,
        publishedAt: new Date(),
      },
      update: {
        stage: spec.stage,
        order: spec.order,
        title: spec.title,
        codename: spec.codename,
        synopsis: spec.synopsis,
        briefing: spec.briefing,
        debrief: spec.debrief,
        learningObjectives: spec.learningObjectives,
        themeColor: spec.themeColor,
        totalPoints,
        passThreshold: spec.passThreshold,
        isPublished: true,
      },
    });

    for (const t of tasks) {
      const existing = await prisma.assignment.findFirst({
        where: { roomId: room.id, order: t.order },
      });
      const payload = {
        roomId: room.id,
        stage: spec.stage,
        title: t.title,
        description: t.description,
        order: t.order,
        maxPoints: t.maxPoints,
        kind: t.kind,
        widget: t.widget,
        widgetConfig: (t.widgetConfig ?? null) as unknown as object,
        flagSalt: t.flagSalt ?? null,
        choices: (t.choices ?? null) as unknown as object,
        correctIndex: t.correctIndex ?? null,
        minWords: t.minWords ?? null,
        dueDate: null,
      };
      if (existing) {
        await prisma.assignment.update({ where: { id: existing.id }, data: payload });
      } else {
        await prisma.assignment.create({ data: payload });
      }
    }

    console.log(
      `[seed] ${slug} → ${spec.title} · ${tasks.length} tasks · ${totalPoints} pts`
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
