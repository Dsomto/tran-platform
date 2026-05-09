import * as Sentry from "@sentry/nextjs";

// Edge runtime init (proxy.ts and any edge route handlers). Same DSN as
// server, smaller sample rate.
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.05,
    environment: process.env.VERCEL_ENV || "development",
  });
}
