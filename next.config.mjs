/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: { dynamic: 30 },
    serverComponentsExternalPackages: ["@node-rs/argon2"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
    ],
  },
};

export default nextConfig;
