import type { NextConfig } from "next";
import { RemotePattern } from "next/dist/shared/lib/image-config";

const remotePatterns: RemotePattern[] = [
	{
		protocol: "https",
		hostname: "oaidalleapiprodscus.blob.core.windows.net",
	},
	{
		protocol: "https",
		hostname: "con-com.s3.eu-north-1.amazonaws.com",
	},
];

const nextConfig: NextConfig = {
	serverExternalPackages: ["@node-rs/argon2"],
	images: { remotePatterns },
};

export default nextConfig;
