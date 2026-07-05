import crypto from "crypto";
import { cronSecret, jwtSecret } from "./secrets";

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function documentSigningSecrets(): string[] {
  const secrets: string[] = [];
  try {
    secrets.push(cronSecret());
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[certificate-link] CRON_SECRET unavailable; falling back to NEXTAUTH_SECRET for document links.",
        error
      );
    }
  }
  secrets.push(jwtSecret());
  return unique(secrets);
}

function documentSigningSecret(): string {
  return documentSigningSecrets()[0];
}

function shortHmac(secret: string, value: string, length: number): string {
  return crypto.createHmac("sha256", secret).update(value).digest("hex").slice(0, length);
}

function validShareSig(scope: string, reportId: string, internId: string, sig: string | null): boolean {
  if (!sig) return false;
  const value = `${scope}:${reportId}:${internId}`;
  return documentSigningSecrets().some((secret) => shortHmac(secret, value, 16) === sig);
}

// Share signature that goes in the certificate URL. Not a full secret —
// just enough to stop unauthenticated scraping. The recipient has the link
// via email, or can access via their logged-in dashboard.
export function certificateShareSig(reportId: string, internId: string): string {
  return shortHmac(documentSigningSecret(), `share:${reportId}:${internId}`, 16);
}

export function isValidCertificateShareSig(
  reportId: string,
  internId: string,
  sig: string | null
): boolean {
  return validShareSig("share", reportId, internId, sig);
}

export function certificateIdFor(reportId: string): string {
  return shortHmac(documentSigningSecret(), `cert:${reportId}`, 12).toUpperCase();
}

// Build the full download URL for an email.
export function certificateUrl(opts: {
  origin: string;
  reportId: string;
  internId: string;
}): string {
  const sig = certificateShareSig(opts.reportId, opts.internId);
  return `${opts.origin.replace(/\/$/, "")}/api/certificate/${opts.reportId}?sig=${sig}`;
}

// Public, human-facing verification page for a certificate. This is the URL we
// put in the LinkedIn "Credential URL" field — it shows the holder, the title,
// the issue date and a verified badge, and links to the PDF. Reuses the same
// "share" signature as the certificate download so one link covers both.
export function verifyUrl(opts: {
  origin: string;
  reportId: string;
  internId: string;
}): string {
  const sig = certificateShareSig(opts.reportId, opts.internId);
  return `${opts.origin.replace(/\/$/, "")}/verify/${opts.reportId}?sig=${sig}`;
}

// Same HMAC pattern for the end-of-programme discontinuation letter sent to
// interns who did not meet the passing threshold. Different scope string
// ("letter") so a leaked certificate sig cannot be reused on the letter URL
// and vice versa.
export function letterShareSig(reportId: string, internId: string): string {
  return shortHmac(documentSigningSecret(), `letter:${reportId}:${internId}`, 16);
}

export function isValidLetterShareSig(
  reportId: string,
  internId: string,
  sig: string | null
): boolean {
  return validShareSig("letter", reportId, internId, sig);
}

export function letterIdFor(reportId: string): string {
  return shortHmac(documentSigningSecret(), `letter-id:${reportId}`, 12).toUpperCase();
}

export function letterUrl(opts: {
  origin: string;
  reportId: string;
  internId: string;
}): string {
  const sig = letterShareSig(opts.reportId, opts.internId);
  return `${opts.origin.replace(/\/$/, "")}/api/letter/${opts.reportId}?sig=${sig}`;
}

// Pass letter (formal achievement letter) — companion to the certificate.
// Different scope so a leaked sig from cert or discontinuation letter cannot
// reuse on this endpoint.
export function passLetterShareSig(reportId: string, internId: string): string {
  return shortHmac(documentSigningSecret(), `pass-letter:${reportId}:${internId}`, 16);
}

export function isValidPassLetterShareSig(
  reportId: string,
  internId: string,
  sig: string | null
): boolean {
  return validShareSig("pass-letter", reportId, internId, sig);
}

export function passLetterIdFor(reportId: string): string {
  return shortHmac(documentSigningSecret(), `pass-letter-id:${reportId}`, 12).toUpperCase();
}

export function passLetterUrl(opts: {
  origin: string;
  reportId: string;
  internId: string;
}): string {
  const sig = passLetterShareSig(opts.reportId, opts.internId);
  return `${opts.origin.replace(/\/$/, "")}/api/pass-letter/${opts.reportId}?sig=${sig}`;
}

// Proof-of-work badge for Stage 3 passers. Kept on its own scope so a
// certificate or letter URL cannot be replayed against the badge endpoint.
export function proofBadgeShareSig(reportId: string, internId: string): string {
  return shortHmac(documentSigningSecret(), `proof-badge:${reportId}:${internId}`, 16);
}

export function isValidProofBadgeShareSig(
  reportId: string,
  internId: string,
  sig: string | null
): boolean {
  return validShareSig("proof-badge", reportId, internId, sig);
}

export function proofBadgeIdFor(reportId: string): string {
  return shortHmac(documentSigningSecret(), `proof-badge-id:${reportId}`, 12).toUpperCase();
}

export function proofBadgeUrl(opts: {
  origin: string;
  reportId: string;
  internId: string;
}): string {
  const sig = proofBadgeShareSig(opts.reportId, opts.internId);
  return `${opts.origin.replace(/\/$/, "")}/api/proof-of-work-badge/${opts.reportId}?sig=${sig}`;
}

// Cyber Core Associate package (Stage 4): promotion letter, in-depth letter,
// completion card, badge. One "cyber-core" scope covers all of them; the piece
// is in the path. Kept distinct from the certificate/letter scopes above.
export function cyberCoreShareSig(reportId: string, internId: string): string {
  return shortHmac(documentSigningSecret(), `cyber-core:${reportId}:${internId}`, 16);
}

export function isValidCyberCoreShareSig(
  reportId: string,
  internId: string,
  sig: string | null
): boolean {
  return validShareSig("cyber-core", reportId, internId, sig);
}

export function cyberCorePieceUrl(opts: {
  origin: string;
  reportId: string;
  internId: string;
  piece: "promotion" | "indepth" | "card" | "badge";
}): string {
  const sig = cyberCoreShareSig(opts.reportId, opts.internId);
  return `${opts.origin.replace(/\/$/, "")}/api/cyber-core/${opts.reportId}/${opts.piece}?sig=${sig}`;
}
