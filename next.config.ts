import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	serverExternalPackages: ["@node-rs/argon2"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "oaidalleapiprodscus.blob.core.windows.net",
			},
		],
	},
};

export default nextConfig;
