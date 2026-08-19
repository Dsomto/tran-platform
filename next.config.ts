import type { NextConfig } from "next";

// Security headers applied to every route. The goal is conservative defaults
// that match how the app actually works today — not "copy the strictest CSP
// you can find." Each header is commented with the threat it addresses.
const securityHeaders = [
  // Force HTTPS. Two years, include subdomains, eligible for browser preload list.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Prevent MIME sniffing: a .jpg that's actually HTML should not render as HTML.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Clickjacking: stop other sites from iframing us.
  { key: "X-Frame-Options", value: "DENY" },
  // Don't leak full URL (including stage tokens!) in Referer to external sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Deny browser features we don't use.
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()",
  },
  // Content-Security-Policy. Conservative but working with current app:
  //  - 'unsafe-inline' on scripts/styles because Tailwind v4 + Next 16 inline
  //    small chunks during render. Can be tightened with a nonce later.
  //  - 'unsafe-eval' only in development (Next dev uses it for HMR).
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      `script-src 'self' 'unsafe-inline'${
        process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""
      } https://vercel.live https://va.vercel-scripts.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.unsplash.com",
      "connect-src 'self' https://vercel.live wss://ws-us3.pusher.com https://*.ingest.sentry.io https://*.sentry.io",
      "form-action 'self'",
      "frame-src 'none'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // PDFKit reads its built-in font metrics (.afm) files from disk at runtime
  // via fs.readFileSync('node_modules/pdfkit/js/data/{Helvetica,...}.afm').
  // Next's serverless tracer can't follow that string-concatenated path, so
  // the Vercel bundle ships without them and every cert/letter call fails
  // with ENOENT. Force the whole pdfkit data dir into the function's working
  // set for every PDF-generating route.
  outputFileTracingIncludes: {
    "/api/certificate/**": ["./node_modules/pdfkit/js/data/**"],
    "/api/letter/**": ["./node_modules/pdfkit/js/data/**"],
    "/api/pass-letter/**": ["./node_modules/pdfkit/js/data/**"],
    "/api/advanced-stage/artifact": [
      "./stage5-artifacts/soc_analysis/stage-5/shared-stage5-b1.tar.gz",
      "./stage5-artifacts/ethical_hacking/stage-5/shared-stage5-b1.tar.gz",
      "./stage5-artifacts/grc/stage-5/shared-stage5-b1.tar.gz",
      "./advanced-stage-artifacts/soc_analysis/stage-6/shared-stage6-b1.tar.gz",
      "./advanced-stage-artifacts/ethical_hacking/stage-6/shared-stage6-b1.tar.gz",
      "./advanced-stage-artifacts/ethical_hacking/stage-6/shared-stage6-b2.tar.gz",
      "./advanced-stage-artifacts/grc/stage-6/shared-stage6-b1.tar.gz",
      "./advanced-stage-artifacts/soc_analysis/stage-7/shared-stage7-b1.tar.gz",
      "./advanced-stage-artifacts/ethical_hacking/stage-7/shared-stage7-b1.tar.gz",
      "./advanced-stage-artifacts/grc/stage-7/shared-stage7-b1.tar.gz",
      "./advanced-stage-artifacts/soc_analysis/stage-8/shared-stage8-b1.tar.gz",
      "./advanced-stage-artifacts/ethical_hacking/stage-8/shared-stage8-b1.tar.gz",
      "./advanced-stage-artifacts/grc/stage-8/shared-stage8-b1.tar.gz",
      "./advanced-stage-artifacts/soc_analysis/stage-8/shared-stage8-b2.tar.gz",
      "./advanced-stage-artifacts/ethical_hacking/stage-8/shared-stage8-b2.tar.gz",
      "./advanced-stage-artifacts/grc/stage-8/shared-stage8-b2.tar.gz",
      "./advanced-stage-artifacts/soc_analysis/stage-9/shared-stage9-b1.tar.gz",
      "./advanced-stage-artifacts/ethical_hacking/stage-9/shared-stage9-b1.tar.gz",
      "./advanced-stage-artifacts/grc/stage-9/shared-stage9-b1.tar.gz",
    ],
    "/api/advanced-stage/resource": ["./public/advanced-stage/**/*"],
    "/api/admin/staff-docs/**": ["./advanced-stage-staff/marking-guides/**/*"],
  },
  outputFileTracingExcludes: {
    "/*": [
      "./advanced-stage-artifacts/**/*",
      "./stage5-artifacts/**/*",
      "./advanced-artifact-sources/**/*",
      "./stage5-artifact-sources/**/*",
      "./advanced-stage-staff/**/*",
      "./marking-guides/**/*",
      "./scripts/**/*",
      "./docs/**/*",
      "./pictures/**/*",
      "./capstone-resources/**/*",
      "./public/**/*",
      "./.env*",
      "./.tmp/**/*",
      "./**/__pycache__/**/*",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

// Sentry only wraps when SENTRY_DSN is set in env. Without that, withSentryConfig
// is essentially a passthrough — no source-map upload, no instrumentation cost.
import { withSentryConfig } from "@sentry/nextjs";

export default process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      // Hide source maps from public URLs (don't ship .map files alongside JS).
      sourcemaps: { disable: false, deleteSourcemapsAfterUpload: true },
    })
  : nextConfig;
