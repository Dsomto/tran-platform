import { promises as fs } from "fs";
import path from "path";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

type StageSlug =
  | "stage-0"
  | "stage-1"
  | "stage-2"
  | "stage-3"
  | "stage-4"
  | "stage-5"
  | "stage-6"
  | "stage-7"
  | "stage-8"
  | "stage-9";

type StageKey =
  | "STAGE_0"
  | "STAGE_1"
  | "STAGE_2"
  | "STAGE_3"
  | "STAGE_4"
  | "STAGE_5"
  | "STAGE_6"
  | "STAGE_7"
  | "STAGE_8"
  | "STAGE_9";

type Room = {
  slug: string;
  stage: StageKey;
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
  track?: "SOC_ANALYSIS" | "ETHICAL_HACKING" | "GRC" | null;
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
      "- Defence-in-depth, zero trust (NIST 800-207)\n- NIST CSF 2.0, ISO 27001:2022\n- GDPR breach notification and ethics under uncertainty\n- PICERL, risk assessment, BC/DR\n- SABSA / TOGAF basics, executive comms",
    themeColor: "#22d3ee",
    totalPoints: 250,
    passThreshold: 70,
  },
  "stage-5": {
    slug: "advanced-signal",
    stage: "STAGE_5",
    order: 5,
    title: "Advanced 1 - Signal",
    codename: "Advanced Stage - Project 1",
    synopsis: "Build the method. Find the signal. Prove the result survives replay.",
    briefing: "Your specialist track begins here. You receive one assigned variant, one evidence marker, and one revision. Generic work does not clear this room.",
    debrief: "A sound method is useful only when it survives contact with a live system. Project 2 removes the clean laboratory assumptions.",
    learningObjectives: "- Reproducible analysis or testing\n- Evidence integrity\n- Scope discipline\n- Defensible conclusions",
    themeColor: "#16a34a",
    totalPoints: 100,
    passThreshold: 70,
  },
  "stage-6": {
    slug: "advanced-exposure",
    stage: "STAGE_6",
    order: 6,
    title: "Advanced 2 - Exposure",
    codename: "Advanced Stage - Project 2",
    synopsis: "Operate a real system, handle imperfect evidence, and own the safety boundary.",
    briefing: "This room introduces operational risk. Setup, isolation, cleanup, and evidence preservation count as part of the security work.",
    debrief: "You can operate one system. Project 3 asks whether you can design and test the architecture around it.",
    learningObjectives: "- Operational security\n- Failure handling\n- Safety and cleanup\n- Contradiction analysis",
    themeColor: "#d97706",
    totalPoints: 100,
    passThreshold: 72,
  },
  "stage-7": {
    slug: "advanced-architecture",
    stage: "STAGE_7",
    order: 7,
    title: "Advanced 3 - Architecture",
    codename: "Advanced Stage - Project 3",
    synopsis: "Build the whole design and prove both the allowed and forbidden paths.",
    briefing: "This is the last room with a revision. The work now spans a system: architecture, controls, tests, exceptions, and evidence must agree.",
    debrief: "The design is complete. Project 4 removes revision and puts the work under adversarial questioning.",
    learningObjectives: "- Systems thinking\n- Positive and negative testing\n- Control design\n- Tradeoff decisions",
    themeColor: "#2563eb",
    totalPoints: 100,
    passThreshold: 75,
  },
  "stage-8": {
    slug: "advanced-adversity",
    stage: "STAGE_8",
    order: 8,
    title: "Advanced 4 - Adversity",
    codename: "Advanced Stage - Project 4",
    synopsis: "No revision. Reproduce the work and defend it against unseen questions.",
    briefing: "The submitted package is final. A recorded defense and raw artifacts determine whether the work is genuinely yours and whether the conclusions hold.",
    debrief: "You defended a difficult build. The capstone now asks you to command a complete case while the facts move.",
    learningObjectives: "- Advanced execution\n- Blind-spot analysis\n- Live reproduction\n- Professional defense",
    themeColor: "#e11d48",
    totalPoints: 100,
    passThreshold: 78,
  },
  "stage-9": {
    slug: "advanced-final-case",
    stage: "STAGE_9",
    order: 9,
    title: "Advanced 5 - The Final Case",
    codename: "Advanced Stage - Capstone",
    synopsis: "Recover the truth, make the decision, and hold it in live defense.",
    briefing: "No revision. The capstone combines raw execution, executive judgment, exact proof, and a live fact injection. Top-three work must remain correct when the room changes.",
    debrief: "The case is closed. The final ranking is based on cumulative evidence, the capstone, and the live defense.",
    learningObjectives: "- End-to-end ownership\n- Decision-making under uncertainty\n- Executive communication\n- Live defense",
    themeColor: "#dc2626",
    totalPoints: 100,
    passThreshold: 80,
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

    // Upsert the room WITHOUT a fresh totalPoints yet — we compute it from
    // actual DB assignment rows after upserts/skips, so a skipped (submission-
    // protected) assignment doesn't desync Room.totalPoints from reality.
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
        totalPoints: spec.totalPoints, // placeholder on create; recomputed below
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
        // totalPoints intentionally omitted here; recomputed at the end of this
        // iteration from the actual assignment rows (including any that were
        // skipped because they have submissions).
        passThreshold: spec.passThreshold,
        isPublished: true,
      },
    });

    const FORCE_RESEED = process.env.FORCE_RESEED === "1";
    let skippedAny = false;
    for (const t of tasks) {
      const existing = await prisma.assignment.findFirst({
        where: { roomId: room.id, order: t.order, track: t.track ?? null },
        include: { _count: { select: { submissions: true } } },
      });
      const payload = {
        roomId: room.id,
        stage: spec.stage,
        track: t.track ?? null,
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
        isClosed: false,
        closedAt: null,
      };
      if (existing) {
        // Safety: refuse to overwrite a task's content under intern work.
        // A reseed that updates description/maxPoints/etc. mid-cohort silently
        // rewrites the prompt under already-submitted answers. Require an
        // explicit FORCE_RESEED=1 to override.
        if (existing._count.submissions > 0 && !FORCE_RESEED) {
          console.warn(
            `[seed] SKIP ${slug} task ${t.order} "${t.title}" — has ${existing._count.submissions} submission(s). ` +
              `Set FORCE_RESEED=1 to override, or use scripts/migrate-stage-content.ts.`
          );
          skippedAny = true;
          continue;
        }
        await prisma.assignment.update({ where: { id: existing.id }, data: payload });
      } else {
        await prisma.assignment.create({ data: payload });
      }
    }

    // If a room task was removed from the JSON source, close the existing DB
    // assignment so old seeded rows don't keep appearing on the mission board.
    const taskKeys = new Set(tasks.map((t) => `${t.order}:${t.track ?? "ALL"}`));
    const staleTasks = await prisma.assignment.findMany({
      where: { roomId: room.id, isClosed: false },
      select: { id: true, order: true, title: true, track: true },
    });
    for (const stale of staleTasks) {
      if (stale.order != null && taskKeys.has(`${stale.order}:${stale.track ?? "ALL"}`)) continue;
      await prisma.assignment.update({
        where: { id: stale.id },
        data: { isClosed: true, closedAt: new Date() },
      });
      console.warn(
        `[seed] CLOSE ${slug} task ${stale.order ?? "?"} "${stale.title}" — no longer present in JSON.`
      );
    }

    // Recompute totalPoints from what's actually in the DB. Skipped assignments
    // contribute their old maxPoints; upserted assignments contribute the new
    // maxPoints. Either way the Room reflects the row totals graders see.
    const actual = await prisma.assignment.findMany({
      where: { roomId: room.id, isClosed: false },
      select: { maxPoints: true },
    });
    // Advanced rooms hold one assignment per track. An intern only sees their
    // own assignment, so summing all three would advertise a 300-point room.
    const dbTotal = slug >= "stage-5"
      ? Math.max(...actual.map((a) => a.maxPoints), spec.totalPoints)
      : actual.reduce((s, a) => s + a.maxPoints, 0) || spec.totalPoints;
    if (dbTotal !== room.totalPoints) {
      await prisma.room.update({ where: { id: room.id }, data: { totalPoints: dbTotal } });
    }

    console.log(
      `[seed] ${slug} → ${spec.title} · ${tasks.length} task(s) in JSON · ${actual.length} in DB · ${dbTotal} pts` +
        (skippedAny ? "  (some tasks skipped — see warnings above)" : "")
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
