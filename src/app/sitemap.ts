import type { MetadataRoute } from "next";

const BASE_URL = "https://ubuntubridgeinitiatives.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/apply`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/apply/data-scholarship`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/tracks`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/tracks/soc`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/tracks/ethical-hacking`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/tracks/grc`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/hire`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/play`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/play/cyberwordle`, lastModified: now, changeFrequency: "daily", priority: 0.4 },
    { url: `${BASE_URL}/play/sudoku`, lastModified: now, changeFrequency: "weekly", priority: 0.3 },
    { url: `${BASE_URL}/play/trivia`, lastModified: now, changeFrequency: "weekly", priority: 0.3 },
    { url: `${BASE_URL}/play/memory`, lastModified: now, changeFrequency: "weekly", priority: 0.3 },
    { url: `${BASE_URL}/play/crossword`, lastModified: now, changeFrequency: "weekly", priority: 0.3 },
  ];
  return pages;
}
