import type { MetadataRoute } from "next";

import { BRAND } from "@/lib/brand";
import { href } from "@/lib/routes";

/**
 * Web app manifest: makes "Add to Home Screen" / "Install" open Qura as a
 * standalone app with its own icon, splash colors and shortcuts.
 * Icons are generated at build time (app/icons/[name]/route.ts).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    // Stable identity: the installed app stays the same app even if
    // start_url changes later.
    id: "/",
    name: "Qura — Your city, one feed",
    short_name: BRAND.name,
    description:
      "Discover restaurants, events, jobs, apartments, and more — all in one local feed.",
    lang: "en",
    dir: "auto",
    start_url: href("home"),
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: BRAND.light.background,
    theme_color: BRAND.light.background,
    categories: ["lifestyle", "social", "travel", "food"],
    // Reopening from the icon focuses the open window instead of a new one.
    launch_handler: { client_mode: ["navigate-existing", "auto"] },
    prefer_related_applications: false,
    icons: [
      { src: "/icons/192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // Long-press the app icon → jump straight to these screens.
    shortcuts: [
      {
        name: "Search",
        url: href("search"),
        icons: [{ src: "/icons/96.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Profile",
        url: href("profile"),
        icons: [{ src: "/icons/96.png", sizes: "96x96", type: "image/png" }],
      },
    ],
  };
}
