import crypto from "crypto";
import { cronSecret, jwtSecret } from "./secrets";

function documentSigningSecret(): string {
  try {
    return cronSecret();
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[certificate-link] CRON_SECRET unavailable; falling back to NEXTAUTH_SECRET for document links.",
        error
      );
    }
    return jwtSecret();
  }
}

// Share signature that goes in the certificate URL. Not a full secret —
// just enough to stop unauthenticated scraping. The recipient has the link
// via email, or can access via their logged-in dashboard.
export function certificateShareSig(reportId: string, internId: string): string {
  return crypto
    .createHmac("sha256", documentSigningSecret())
    .update(`share:${reportId}:${internId}`)
    .digest("hex")
    .slice(0, 16);
}

export function certificateIdFor(reportId: string): string {
  return crypto
    .createHmac("sha256", documentSigningSecret())
    .update(`cert:${reportId}`)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
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

// Same HMAC pattern for the end-of-programme discontinuation letter sent to
// interns who did not meet the passing threshold. Different scope string
// ("letter") so a leaked certificate sig cannot be reused on the letter URL
// and vice versa.
export function letterShareSig(reportId: string, internId: string): string {
  return crypto
    .createHmac("sha256", documentSigningSecret())
    .update(`letter:${reportId}:${internId}`)
    .digest("hex")
    .slice(0, 16);
}

export function letterIdFor(reportId: string): string {
  return crypto
    .createHmac("sha256", documentSigningSecret())
    .update(`letter-id:${reportId}`)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
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
  return crypto
    .createHmac("sha256", documentSigningSecret())
    .update(`pass-letter:${reportId}:${internId}`)
    .digest("hex")
    .slice(0, 16);
}

export function passLetterIdFor(reportId: string): string {
  return crypto
    .createHmac("sha256", documentSigningSecret())
    .update(`pass-letter-id:${reportId}`)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
}

export function passLetterUrl(opts: {
  origin: string;
  reportId: string;
  internId: string;
}): string {
  const sig = passLetterShareSig(opts.reportId, opts.internId);
  return `${opts.origin.replace(/\/$/, "")}/api/pass-letter/${opts.reportId}?sig=${sig}`;
}
