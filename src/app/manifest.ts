import type { MetadataRoute } from "next";

import { href } from "@/lib/routes";

/** Makes "Add to Home Screen" open Qura as a standalone, full-screen app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Qura",
    short_name: "Qura",
    description:
      "Discover restaurants, events, jobs, apartments, and more — all in one local feed.",
    start_url: href("home"),
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
  };
}
