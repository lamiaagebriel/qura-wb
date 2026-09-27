import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

/**
 * /robots.txt — only the API is blocked. Personal/auth pages stay crawlable
 * on purpose: they carry `noindex`, which crawlers can only see if they're
 * allowed to fetch the page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${env.APP_URL}/sitemap.xml`,
    host: env.APP_URL,
  };
}
