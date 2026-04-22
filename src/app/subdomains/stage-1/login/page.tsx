import { redirect } from "next/navigation";
import { STAGE_THEMES } from "@/components/stage/themes";
import { getDoorSession, stageEncodingHint } from "@/lib/stage-login";
import StageLandingLogin from "../_components/StageLandingLogin";

const STAGE_CONTENT = {
  tagline: "The Griot left encrypted breadcrumbs. Peel back every layer.",
  storyline: [
    "Last chapter Amaka confirmed what Tunde suspected: the Q2 login was not routine. The adversary known only as The Griot was already inside Sankofa Digital when the quarter closed.",
    "Tunde pulled a zip of files from The Griot's staging server — notes, configs, session tokens, an innocuous-looking image. All encrypted or encoded, most of it sloppily. Your job is to peel back every layer and document the mistakes.",
    "By the end of this room you will surface a path that points deeper into Sankofa's own infrastructure. That path is the thread the next chapter pulls on.",
  ],
  topics: [
    "Symmetric encryption (AES-GCM, AES-CBC, ECB)",
    "Asymmetric encryption (RSA, key exchange)",
    "Hashing vs encryption, message authentication (HMAC)",
    "TLS / PKI essentials, digital signatures",
    "Steganography, password hashing, JWT structure",
    "Classical ciphers (Caesar, Vigenère) as pedagogy",
  ],
  readings: [
    { label: "Crypto 101 (free book by lvh)", href: "https://www.crypto101.io/" },
    { label: "OWASP Cryptographic Storage Cheat Sheet", href: "https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html" },
    { label: "JWT.io — structure reference", href: "https://jwt.io/introduction" },
  ],
};

export default async function Stage1LoginPage() {
  const session = await getDoorSession("stage-1");
  if (session) redirect("/");

  const theme = STAGE_THEMES["stage-1"];
  const hint = stageEncodingHint("stage-1");

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
