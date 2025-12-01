import type { NextConfig } from "next";
import { RemotePattern } from "next/dist/shared/lib/image-config";

const remotePatterns: RemotePattern[] = [
  // { protocol: "https", hostname: "oaidalleapiprodscus.blob.core.windows.net" },
  { protocol: "https", hostname: "qura-1.s3.eu-north-1.amazonaws.com" },
  { protocol: "https", hostname: "lh3.googleusercontent.com" },
];

const nextConfig: NextConfig = {
  images: { remotePatterns },
};

export default nextConfig;
