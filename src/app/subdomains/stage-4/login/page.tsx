import { redirect } from "next/navigation";
import { STAGE_THEMES } from "@/components/stage/themes";
import { getDoorSession, stageEncodingHint } from "@/lib/stage-login";
import StageLandingLogin from "../_components/StageLandingLogin";

const STAGE_CONTENT = {
  tagline: "Synthesise the investigation. Brief the board. Pick your track — it is binding.",
  storyline: [
    "Six weeks ago you were triaging a Q2 login anomaly. Tonight you stand in front of Sankofa Digital's board. They don't care about TTPs. They care about three things: did customer PII leave the building, are we in breach of NDPA, and what does the next twelve months of security spend look like.",
    "This is the capstone. You will produce the artefacts that land on the chair's desk — an incident timeline, a risk register, a regulatory position, a remediation roadmap, and your track selection. The chair reads every one of them. There is no participation mark.",
    "When the chair signs off, you are no longer a candidate. You are a TRAN intern with a specialisation, and the next chapter of your work is the one you chose.",
  ],
  topics: [
    "Defence-in-depth, zero trust architecture (NIST SP 800-207)",
    "NIST Cybersecurity Framework 2.0 · ISO/IEC 27001:2022",
    "Nigeria Data Protection Act 2023 · NDPR 2019 · GDPR cross-border",
    "PICERL incident response lifecycle",
    "Quantitative and qualitative risk assessment",
    "Business continuity & disaster recovery (RTO/RPO)",
    "Executive communication · board-level briefing structure",
    "Security architecture (SABSA, TOGAF fundamentals)",
    "Track selection · the three paths: SOC, Ethical Hacking, GRC",
  ],
  readings: [
    { label: "NIST Cybersecurity Framework 2.0", href: "https://www.nist.gov/cyberframework" },
    { label: "NIST SP 800-207 — Zero Trust Architecture", href: "https://csrc.nist.gov/publications/detail/sp/800-207/final" },
    { label: "Nigeria Data Protection Act 2023 (full text)", href: "https://ndpc.gov.ng/" },
    { label: "SANS Incident Handler's Handbook", href: "https://www.sans.org/white-papers/33901/" },
    { label: "Minto Pyramid Principle — briefing structure", href: "https://untools.co/minto-pyramid/" },
  ],
};

export default async function Stage4LoginPage() {
  const session = await getDoorSession("stage-4");
  if (session) redirect("/");

  const theme = STAGE_THEMES["stage-4"];
  const hint = stageEncodingHint("stage-4");

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
