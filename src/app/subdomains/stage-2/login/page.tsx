import { redirect } from "next/navigation";
import { STAGE_THEMES } from "@/components/stage/themes";
import { getDoorSession, stageEncodingHint } from "@/lib/stage-login";
import StageLandingLogin from "../_components/StageLandingLogin";

const STAGE_CONTENT = {
  tagline: "Map the perimeter. Reconstruct the breach — in a sandboxed lab.",
  storyline: [
    "Stage 1 ended with a lead: a hidden message pointing at sankofa.internal/legacy-admin/ — a path that should have been decommissioned last year. Amaka wants you to walk it end to end.",
    "Everything in this chapter happens inside a simulated browser lab. No real system is touched. Your task is to reconstruct, step by step, exactly what The Griot did once they reached the perimeter — so the board understands what failed and legal has a clean record.",
    "By the final task you will be able to explain the full exploit chain in plain language and draw the attack surface for the next meeting.",
  ],
  topics: [
    "TCP/IP, DNS, HTTP fundamentals",
    "OWASP Top 10 (2021) — injection, XSS, SSRF, CSRF",
    "Reconnaissance, directory enumeration",
    "Authentication flaws, JWT weaknesses",
    "CVE / CVSS v3.1 severity scoring",
    "Writing exploit chains for non-technical audiences",
  ],
  readings: [
    { label: "OWASP Top 10 (2021)", href: "https://owasp.org/Top10/" },
    { label: "PortSwigger Web Security Academy (free)", href: "https://portswigger.net/web-security" },
    { label: "CVSS v3.1 Specification", href: "https://www.first.org/cvss/v3.1/specification-document" },
  ],
};

export default async function Stage2LoginPage() {
  const session = await getDoorSession("stage-2");
  if (session) redirect("/");

  const theme = STAGE_THEMES["stage-2"];
  const hint = stageEncodingHint("stage-2");

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
