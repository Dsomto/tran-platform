import crypto from "crypto";

// Share signature that goes in the certificate URL. Not a full secret —
// just enough to stop unauthenticated scraping. The recipient has the link
// via email, or can access via their logged-in dashboard.
export function certificateShareSig(reportId: string, internId: string): string {
  const secret = process.env.CRON_SECRET || "fallback";
  return crypto
    .createHmac("sha256", secret)
    .update(`share:${reportId}:${internId}`)
    .digest("hex")
    .slice(0, 16);
}

export function certificateIdFor(reportId: string): string {
  const secret = process.env.CRON_SECRET || "fallback";
  return crypto
    .createHmac("sha256", secret)
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
