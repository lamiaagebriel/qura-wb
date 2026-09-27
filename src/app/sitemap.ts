import type { MetadataRoute } from "next";

import { env } from "@/lib/env";
import { href, type RouteName } from "@/lib/routes";

// Public, indexable screens. Add feed/business pages here as they're built.
const PUBLIC_ROUTES: { route: RouteName; priority: number }[] = [
  { route: "home", priority: 1 },
  { route: "search", priority: 0.8 },
];

/** /sitemap.xml */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map(({ route, priority }) => ({
    url: `${env.APP_URL}${href(route)}`,
    changeFrequency: "daily",
    priority,
  }));
}
