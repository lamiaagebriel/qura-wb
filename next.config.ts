import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["192.168.1.5", "192.168.1.13", "172.20.10.12"],
};

export default nextConfig;
