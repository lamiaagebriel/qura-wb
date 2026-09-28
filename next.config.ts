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
};

export default nextConfig;
