import * as Sentry from "@sentry/nextjs";

// Server-side Sentry init. Only active when SENTRY_DSN is set in env —
// without that, Sentry's SDK is a no-op and shipping cost is essentially
// zero. Set the env in Vercel (Production scope) when you're ready to
// turn error tracking on.
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // 10% trace sampling on the server. Plenty for spotting performance
    // regressions without blowing out the Sentry quota.
    tracesSampleRate: 0.1,
    // Drop noisy expected errors (rate-limit responses, auth failures
    // returned as 401 — these are part of normal flow, not bugs).
    beforeSend(event, hint) {
      const err = hint?.originalException;
      if (err instanceof Error) {
        if (
          err.message?.includes("Rate limit exceeded") ||
          err.message?.includes("Invalid credentials")
        ) {
          return null;
        }
      }
      return event;
    },
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
  });
}
