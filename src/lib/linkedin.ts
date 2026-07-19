// LinkedIn "Add to Profile" helper. LinkedIn lets anyone deep-link into the
// member's "Add licenses & certifications" flow with the fields pre-filled —
// this is the free, first-party equivalent of Credly's "Add to LinkedIn"
// button. Docs: https://addtoprofile.linkedin.com/
//
// The issuing organization is our LinkedIn page (showcase) Ubuntu Bridge
// Initiative, org id 119004584. Passing organizationId links the credential to
// the page and shows the logo; organizationName is the text fallback.

export const UBI_LINKEDIN_ORG_ID = "119004584";
export const UBI_LINKEDIN_ORG_NAME = "Ubuntu Bridge Initiative";

// The certification title shown on the LinkedIn profile, per stage. Kept
// descriptive and self-contained so it reads well on a CV without our context.
const STAGE_CERT_NAME: Record<string, string> = {
  STAGE_0: "Cybersecurity Internship: Foundations (Stage 0)",
  STAGE_1: "Cybersecurity Internship: Applied Cryptography (Stage 1)",
  STAGE_2: "Cybersecurity Internship: Web Application Security (Stage 2)",
  STAGE_3: "Cybersecurity Internship: Incident Response (Stage 3)",
  STAGE_4: "Certified Cyber Core Associate",
  STAGE_5: "Cybersecurity Internship: Track Specialisation (Stage 5)",
  STAGE_6: "Cybersecurity Internship: Advanced Exposure (Stage 6)",
  STAGE_7: "Cybersecurity Internship: Security Architecture (Stage 7)",
  STAGE_8: "Cybersecurity Internship: Adversarial Assessment (Stage 8)",
  STAGE_9: "Cybersecurity Internship: Advanced Track Finalist",
};

export function stageCertName(stageKey: string): string {
  return STAGE_CERT_NAME[stageKey] ?? `Cybersecurity Internship (${stageKey.replace("STAGE_", "Stage ")})`;
}

export function buildAddToProfileUrl(opts: {
  stageKey: string;
  issuedAt: Date;
  certId: string;
  certUrl: string;
}): string {
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: stageCertName(opts.stageKey),
    organizationId: UBI_LINKEDIN_ORG_ID,
    organizationName: UBI_LINKEDIN_ORG_NAME,
    issueYear: String(opts.issuedAt.getUTCFullYear()),
    issueMonth: String(opts.issuedAt.getUTCMonth() + 1),
    certId: opts.certId,
    certUrl: opts.certUrl,
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}
