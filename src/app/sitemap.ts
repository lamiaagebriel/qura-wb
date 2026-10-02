import type { MetadataRoute } from "next";

import { ALL_CATEGORIES } from "@/lib/categories";
import { allBusinessHandles } from "@/lib/data/businesses";
import { env } from "@/lib/env";
import { href, routes, type RouteName } from "@/lib/routes";

// Public, indexable screens. Add feed pages here as they're built.
type StaticRoute = {
  [K in RouteName]: (typeof routes)[K] extends `${string}:${string}` ? never : K;
}[RouteName];

const PUBLIC_ROUTES: { route: StaticRoute; priority: number }[] = [
  { route: "home", priority: 1 },
  { route: "search", priority: 0.8 },
];

// Rebuilt at most hourly, so new businesses show up without a deploy.
export const revalidate = 3600;

/** /sitemap.xml */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const businesses = await allBusinessHandles();
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
    // Every business's profile.
    ...businesses.map(({ username, updatedAt }) => ({
      url: `${env.APP_URL}${href("business", { params: { username } })}`,
      lastModified: updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
