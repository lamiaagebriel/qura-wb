import type { NextConfig } from "next";

import { env } from "./src/lib/env";

// Private network ranges (home Wi-Fi, phone hotspots, office networks), so a
// phone can test the dev server from any network without config changes.
const PRIVATE_NETWORKS = ["192.168.*.*", "10.*.*.*", "172.*.*.*"];

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Dev only: let other devices (a phone on the network, a tunnel) load the
  // dev server's JS/HMR — otherwise the page renders but never hydrates and
  // nothing is tappable. Extra hosts (tunnels) come from TRUSTED_ORIGINS.
  allowedDevOrigins: [
    ...PRIVATE_NETWORKS,
    ...(env.TRUSTED_ORIGINS ?? []).map((origin) => new URL(origin).hostname),
  ],
  // Browsers still ask for /favicon.ico on their own; serve the drawn icon.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon" }];
  },
  // The service worker must never be cached, so every deploy's version is
  // picked up immediately (Next's PWA guide).
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
