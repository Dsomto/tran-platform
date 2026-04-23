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
      "connect-src 'self' https://vercel.live wss://ws-us3.pusher.com",
      "form-action 'self'",
      "frame-src 'none'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
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

export default nextConfig;
