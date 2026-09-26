import type { NextConfig } from "next";

import { env } from "./src/lib/env";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Dev only: let other devices (phone on the LAN, a tunnel) load the dev
  // server's JS/HMR — otherwise the page renders but never hydrates.
  // Same list as the auth origins: set them once in TRUSTED_ORIGINS.
  allowedDevOrigins: (env.TRUSTED_ORIGINS ?? []).map(
    (origin) => new URL(origin).hostname,
  ),
};

export default nextConfig;
