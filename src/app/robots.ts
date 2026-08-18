import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Wildcard intentionally covers AI/answer-engine crawlers too
        // (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.) — GEO relies on
        // this content being crawlable, not blocked.
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
