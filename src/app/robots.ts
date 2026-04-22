import type { MetadataRoute } from "next";

const BASE_URL = "https://ubuntubridgeinitiatives.org";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/apply", "/tracks", "/hire", "/play"],
        disallow: [
          "/api/",
          "/admin/",
          "/ops/",
          "/dashboard/",
          "/login",
          "/subdomains/",
          // Stage token paths — don't advertise them.
          "/k7m2xq9bt4",
          "/j9p3r8nhv2",
          "/w4c7qy5dlm",
          "/z2f8gt3kxs",
          "/h6vb1wnq7e",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
