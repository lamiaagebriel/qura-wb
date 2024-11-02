import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: "200mb",
		},
	},
	serverExternalPackages: ["@node-rs/argon2"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "source.boringavatars.com",
			},
			{
				protocol: "https",
				hostname: "oaidalleapiprodscus.blob.core.windows.net",
			},
			{
				protocol: "https",
				hostname: "con-com.s3.eu-north-1.amazonaws.com",
			},
		],
	},
};

export default nextConfig;
