import { redirect } from "next/navigation";
import { STAGE_THEMES } from "@/components/stage/themes";
import { getDoorSession, stageEncodingHint } from "@/lib/stage-login";
import StageLandingLogin from "../_components/StageLandingLogin";

const STAGE_CONTENT = {
  tagline: "Your first morning at Sankofa Digital.",
  storyline: [
    "Sankofa Digital — a pan-African fintech — has been breached by an APT known only as The Griot. The board has authorised a junior analyst rotation to work the breach room by room.",
    "You are one of the interns. Your supervisor, Amaka Eze, runs the security office. A senior analyst, Tunde Bakare, drops in with hints when you stall. Your first rotation is the SOC bench.",
    "In this stage you settle into the shell, review a Q2 login event that does not sit right, and build the foundation every later chapter depends on.",
  ],
  topics: [
    "CIA triad, AAA, threat taxonomy",
    "Linux CLI basics (ls, cd, cat, grep, chmod, stat)",
    "Hashing (SHA-256), base64 and hex",
    "SIEM log reading and filter patterns",
    "ISC2 Code of Ethics",
  ],
  readings: [
    { label: "Linux Command Line (free PDF)", href: "https://linuxcommand.org/tlcl.php" },
    { label: "ISC2 Code of Ethics", href: "https://www.isc2.org/ethics" },
    { label: "NIST Glossary (CIA, AAA)", href: "https://csrc.nist.gov/glossary" },
  ],
};

export default async function Stage0LoginPage() {
  const session = await getDoorSession("stage-0");
  if (session) redirect("/");

  const theme = STAGE_THEMES["stage-0"];
  const hint = stageEncodingHint("stage-0");

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
