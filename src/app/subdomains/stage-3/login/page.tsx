import { redirect } from "next/navigation";
import { STAGE_THEMES } from "@/components/stage/themes";
import { getDoorSession, stageEncodingHint } from "@/lib/stage-login";
import StageLandingLogin from "../_components/StageLandingLogin";

const STAGE_CONTENT = {
  tagline: "The adversary is inside. Timeline the intrusion. Tell the board.",
  storyline: [
    "Stage 2 closed with a proven exploit chain: recon → legacy admin panel → database pivot. Amaka has now handed you the artefacts from the compromised workstation — memory snapshot, running process list, shell history, SIEM logs, three days of syslog.",
    "Everything here is simulated in-browser. No production target is touched. Your job is to reconstruct what The Griot did once inside: how they persisted, where they pivoted, what they read, and when. Each task adds a layer to the timeline.",
    "By the final task you will have produced an incident timeline, a list of IoCs, an ATT&CK technique mapping, and a one-page executive summary — the material the board will see tomorrow.",
  ],
  topics: [
    "Linux privilege escalation (sudo misconfig, SUID, cron)",
    "Persistence mechanisms (cron, systemd units, SSH keys, rc.local)",
    "Memory forensics basics — volatility plugins, process tree reading",
    "Log correlation across syslog / auth / web / SIEM",
    "MITRE ATT&CK technique mapping",
    "Indicator-of-Compromise (IoC) generation + sharing formats (STIX, MISP)",
    "Incident timeline writing for non-technical audiences",
  ],
  readings: [
    { label: "MITRE ATT&CK — Enterprise Matrix", href: "https://attack.mitre.org/matrices/enterprise/" },
    { label: "GTFOBins (priv-esc via trusted binaries)", href: "https://gtfobins.github.io/" },
    { label: "SANS Incident Handler's Handbook (PDF)", href: "https://www.sans.org/white-papers/33901/" },
    { label: "Volatility 3 documentation", href: "https://volatility3.readthedocs.io/" },
  ],
};

export default async function Stage3LoginPage() {
  const session = await getDoorSession("stage-3");
  if (session) redirect("/");

  const theme = STAGE_THEMES["stage-3"];
  const hint = stageEncodingHint("stage-3");

  return (
    <StageLandingLogin
      theme={theme}
      rule={hint.rule}
      example={hint.example}
      tagline={STAGE_CONTENT.tagline}
      storyline={STAGE_CONTENT.storyline}
      topics={STAGE_CONTENT.topics}
      readings={STAGE_CONTENT.readings}
    />
  );
}
