import type { MetadataRoute } from "next";

const BASE_URL = "https://ubuntubridgeinitiatives.org";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/apply", "/tracks", "/hire", "/play"],
        // Deliberately NOT listing /admin, /ops, /dashboard, or the stage
        // token paths. Listing them in robots.txt would advertise their
        // existence. Those routes respond with 404 to unauthenticated
        // visitors — that is the gate, not robots.txt.
        disallow: ["/api/", "/subdomains/", "/login"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
