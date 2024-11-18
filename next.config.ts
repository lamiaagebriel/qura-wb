import type { NextConfig } from "next";
import { RemotePattern } from "next/dist/shared/lib/image-config";

const remotePatterns: RemotePattern[] = [
	{ protocol: "https", hostname: "oaidalleapiprodscus.blob.core.windows.net" },
	{ protocol: "https", hostname: "con-com.s3.eu-north-1.amazonaws.com" },
	{ protocol: "https", hostname: "lh3.googleusercontent.com" },
];

const nextConfig: NextConfig = {
	serverExternalPackages: ["@node-rs/argon2"],
	eslint: {
		// TODO: at the end remove it to consider eslint
		// Warning: This allows production builds to successfully complete even if
		// your project has ESLint errors.
		ignoreDuringBuilds: true,
	},
	images: { remotePatterns },
};

export default nextConfig;
