import type { NextConfig } from "next";
import { RemotePattern } from "next/dist/shared/lib/image-config";

const remotePatterns: RemotePattern[] = [
  // { protocol: "https", hostname: "oaidalleapiprodscus.blob.core.windows.net" },
  { protocol: "https", hostname: "con-com.s3.eu-north-1.amazonaws.com" },
  // { protocol: "https", hostname: "images.unsplash.com" },
  // { protocol: "https", hostname: "plus.unsplash.com" },
];

const nextConfig: NextConfig = {
  images: { remotePatterns },
  // eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
