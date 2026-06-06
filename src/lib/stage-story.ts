// The connective tissue between the five foundation rooms.
//
// stage-briefs.ts holds the *contents* of each chapter — the mission brief,
// cast, bulletin, capstone tasks. This file holds what makes the five rooms
// feel like one job at one company: where in the building you are, what
// happened in the chapter before, the personal note waiting on your desk,
// and the hook that pulls you into the next room.
//
// Nothing here touches the database. It is pure narrative content, rendered
// by StageLanding / BoardRecap / StageJourneyMap.

import type { StageSlug } from "./stage-routes";

export interface DeskNote {
  /** Who left the note — the lead character for this chapter. */
  from: string;
  role: string;
  /** Paragraphs of the note. May contain the literal token {firstName},
   *  resolved at render time by `personalise()`. */
  lines: string[];
}

export interface StageStory {
  /** Chapter number, 1-5. */
  chapter: number;
  /** Department / room this chapter takes place in. */
  office: string;
  /** One-line recap of the previous chapter. null for Chapter 1. */
  previously: string | null;
  /** The note waiting on the intern's desk when they walk in. */
  deskNote: DeskNote;
  /** One line on what the mission-board tasks train the intern to prove. */
  tasksTeach: string;
  /** Who the capstone report is delivered to. */
  reportTo: string;
  /** The "to be continued" hook shown once the chapter is complete. */
  cliffhanger: string;
}

export const TOTAL_CHAPTERS = 5;

/** Short chapter names, index 0-4, for the progress rail. */
export const CHAPTER_TITLES = [
  "Induction",
  "Ciphers & Secrets",
  "The Attack Surface",
  "Inside the Walls",
  "The Debrief",
] as const;

/** Replace {firstName} tokens. Falls back to a friendly neutral if the name
 *  is missing, so a blank account never renders "Morning, ." */
export function personalise(text: string, firstName?: string | null): string {
  const name = (firstName ?? "").trim();
  return text.replaceAll("{firstName}", name || "there");
}

export const STAGE_STORIES: Record<StageSlug, StageStory> = {
  "stage-0": {
    chapter: 1,
    office: "SOC Bench · Floor 4 — Sankofa Digital HQ, Lagos",
    previously: null,
    deskNote: {
      from: "Amaka Eze",
      role: "Head of Security",
      lines: [
        "Morning, {firstName}. You found the desk — good. Kettle's by the window, and the badge sitting on it is yours. It opens Floor 4 and nothing above it yet. You earn the rest of the building.",
        "I cleared my morning for you because I don't hand the Q2 file to just anyone. The analyst who sat in your chair read one ticket, wrote \"probably nothing\", and closed it. I think they were wrong. I need you to tell me whether I am right to be worried.",
        "Everything I need from you today is on the mission board — work it top to bottom, it's a day at the bench, not a quiz. The capstone folder is the part that actually reaches the Incident Committee, so treat it that way.",
        "One rule before you touch anything: do not tell me it's nothing until you have read every line. Speed without judgement is how we got here.",
      ],
    },
    tasksTeach:
      "Ten desk tasks — shell, hashing, encoding, log triage, ethics. They are the muscle memory behind the report the Incident Committee will read.",
    reportTo: "the Sankofa Digital Incident Committee",
    cliffhanger:
      "You told Amaka the Q2 login was not nothing — and she believed you. Tunde just carried a zip up from a staging server The Griot abandoned. Chapter 2 starts at his desk.",
  },

  "stage-1": {
    chapter: 2,
    office: "Cryptography Lab · Floor 6 — Sankofa Digital HQ",
    previously:
      "In Chapter 1 your Q2 auth-log analysis convinced the Incident Committee the SD-40812 login was real, and your D2 dismissal-pattern walkthrough drove the SOC restructure. The board now knows Sankofa was breached, and they funded this chapter's emergency cryptography audit on the strength of your report.",
    deskNote: {
      from: "Tunde Afolabi",
      role: "Threat Intel Lead",
      lines: [
        "{firstName} — Tunde. We are not strangers any more. Your D2 walkthrough is what got us this room.",
        "There is a zip on the shared drive. I lifted it off a staging server The Griot abandoned forty-eight hours after the public-IP block went live. Configs, session tokens, an image, a handful of \"notes\". All of it encrypted or encoded, and in places done badly. Bad is good. Bad is where we get in.",
        "The board wants two answers. First: what was in those files. The mission board walks you through the decryptions one at a time. Second: which of our own cryptographic decisions let this sit unnoticed for three months. That is the capstone, addressed to Amaka and to Dr. Folake Bello, who you will meet on Friday.",
        "One of the decrypted notes will point at a door we should have closed two years ago. When it does, do not chase it; flag it and bring it to me. Chapter 3 starts there. We were three days late catching the beacon. Don't make it five.",
      ],
    },
    tasksTeach:
      "Decryption, cipher identification, JWT auditing and forgery — the hands-on reps behind the crypto post-mortem the board is waiting on, plus one chained exploit that proves the legacy-admin door is real.",
    reportTo: "Amaka, Dr. Folake Bello, and the Sankofa Digital board",
    cliffhanger:
      "Your post-mortem named the rot, and your forged token unlocked the door. One decrypted note pointed somewhere specific — sankofa.internal/legacy-admin/, a 2019 app that should have died two years ago. You walked through it. Chapter 3 is a war room and Bayo will not enjoy the conversation.",
  },

  "stage-2": {
    chapter: 3,
    office: "Engineering War Room · Floor 5 — Sankofa Digital HQ",
    previously:
      "In Chapter 2 you peeled back The Griot's encrypted files and handed the board five cryptographic controls. One file named a door: /legacy-admin/.",
    deskNote: {
      from: "Ngozi Ojukwu",
      role: "DevSecOps Lead",
      lines: [
        "Hi {firstName} — Ngozi, DevSecOps. I inherited /legacy-admin/ six months ago and I've wanted it dead since day one. I lost that argument. Now I have receipts, and you're going to help me read them out.",
        "The decrypted notes pointed straight at it: a Django app from 2019, meant to be decommissioned two years ago, still online and still public. Bayo only acts on findings he can rank against business risk — so rank them.",
        "The mission board is your recon and analysis bench. The capstone is the pentest report Bayo actually reads. Make the remediation order impossible to argue with.",
        "I told them this app was a liability. Say it again — louder, and with CVSS vectors this time.",
      ],
    },
    tasksTeach:
      "Source review, HTTP-capture tracing, OWASP mapping — the recon that becomes the pentest report for Engineering.",
    reportTo: "Bayo Ogunyemi, Head of Engineering",
    cliffhanger:
      "You proved how The Griot walked in. But the capture showed they didn't stop at the door — they pivoted to a finance workstation and went quiet. Chapter 4: 10.0.1.87 is in quarantine.",
  },

  "stage-3": {
    chapter: 4,
    office: "DFIR Lab · The Crow War Room — Sankofa Digital HQ",
    previously:
      "In Chapter 3 you wrote the pentest report on /legacy-admin/. The HTTP capture showed The Griot pivoting inward — onto a finance analyst's workstation.",
    deskNote: {
      from: "Damilola Akande",
      role: "DFIR Specialist",
      lines: [
        "{firstName}. Dami. They flew me in to lead this one, which means you're on my bench now.",
        "The Griot got in through the door you found, pivoted to a finance workstation — 10.0.1.87 — and sat there 72 hours before Tunde caught the beacon. The box is in the safe. You work from copies, never the original.",
        "The mission board is the artefact work: memory, filesystem, logs, SIEM. The capstone is the incident report Counsel takes to the regulator tomorrow. Every sentence in it traces to a line of evidence. Every single one.",
        "Three rules above my desk: don't touch it, hash everything, when in doubt hash again.",
      ],
    },
    tasksTeach:
      "Memory triage, log timelining, IOC and ATT&CK work — the artefact analysis that becomes the incident report for Counsel.",
    reportTo: "the CISO and Counsel Ifeoma Okeke",
    cliffhanger:
      "Your timeline is on Counsel's desk. Tomorrow at 09:00 it goes to the board — and the board has three questions a timeline alone can't answer. Chapter 5: the boardroom.",
  },

  "stage-4": {
    chapter: 5,
    office: "The Boardroom · Floor 9 — Sankofa Digital HQ",
    previously:
      "In Chapter 4 you built the incident timeline, the IOC list, and the ATT&CK map. Counsel has read it. The board has not.",
    deskNote: {
      from: "Ifeoma Okeke",
      role: "General Counsel",
      lines: [
        "{firstName} — Ifeoma, General Counsel. Sit. We're out of time, and I would rather you heard this from me than from the Chair at 09:01.",
        "Tomorrow the board sits. Three people, three questions: did customer PII leave, are we in breach, and what does next year of security spend cost. They will not ask about ATT&CK technique IDs. They will quote your numbers back at you.",
        "The mission board gets you board-ready. The capstone is the package that goes on the record — risk register, the NDPA breach-notification letter to the NDPC, the roadmap. My draft and yours are submitted together; reconcile them before nine.",
        "This is the last chapter you walk in as a candidate. When the Chair signs, you pick your track and it is binding. Walk in knowing which one.",
      ],
    },
    tasksTeach:
      "Risk-register, regulatory and roadmap drills — the rehearsal for the package you put in front of the board.",
    reportTo: "the Sankofa Digital Board",
    cliffhanger:
      "The Chair signed off. You are no longer a candidate — you are an analyst, on the track you chose. The Griot is still out there. But that is the story of the programme that comes next.",
  },
};
