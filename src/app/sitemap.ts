import type { MetadataRoute } from "next";

import { ALL_CATEGORIES } from "@/lib/categories";
import { env } from "@/lib/env";
import { href, routes, type RouteName } from "@/lib/routes";

// Public, indexable screens. Add feed/business pages here as they're built.
// Dynamic ones (a business's profile) will list their own URLs.
type StaticRoute = {
  [K in RouteName]: (typeof routes)[K] extends `${string}:${string}` ? never : K;
}[RouteName];

const PUBLIC_ROUTES: { route: StaticRoute; priority: number }[] = [
  { route: "home", priority: 1 },
  { route: "search", priority: 0.8 },
];

/** /sitemap.xml */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PUBLIC_ROUTES.map(({ route, priority }) => ({
      url: `${env.APP_URL}${href(route)}`,
      changeFrequency: "daily" as const,
      priority,
    })),
    // Every category, at any depth.
    ...ALL_CATEGORIES.map((c) => ({
      url: `${env.APP_URL}${href("category", { params: { slug: c.slug } })}`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
