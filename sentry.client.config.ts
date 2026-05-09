import * as Sentry from "@sentry/nextjs";

// Client-side Sentry init. Lower sample rate than the server because there
// are far more page loads than server requests. Disabled entirely when
// NEXT_PUBLIC_SENTRY_DSN is unset.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.05,
    // Don't fire Sentry on every adblocker-blocked request or browser
    // extension noise. Keep the quota for real bugs.
    beforeSend(event, hint) {
      const err = hint?.originalException;
      if (err instanceof Error) {
        if (
          err.message?.includes("ResizeObserver loop") ||
          err.message?.includes("Non-Error promise rejection captured")
        ) {
          return null;
        }
      }
      return event;
    },
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
  });
}
