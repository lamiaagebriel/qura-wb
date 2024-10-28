import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";
// import Sharp from "sharp";

export const ID = {
	generate: (props: { len?: number } | void) =>
		crypto.randomBytes(props?.["len"] ?? 16).toString("hex"),
};

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getURL(path: string = "") {
	// Check if NEXT_PUBLIC_SITE_URL is set and non-empty. Set this to your site URL in production env.
	let url =
		process?.env?.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim() !== ""
			? process.env.NEXT_PUBLIC_SITE_URL
			: // If not set, check for NEXT_PUBLIC_VERCEL_URL, which is automatically set by Vercel.
				process?.env?.NEXT_PUBLIC_VERCEL_URL && process.env.NEXT_PUBLIC_VERCEL_URL.trim() !== ""
				? process.env.NEXT_PUBLIC_VERCEL_URL
				: // If neither is set, default to localhost for local development.
					"http://localhost:3000/";

	// Trim the URL and remove trailing slash if exists.
	url = url.replace(/\/+$/, "");
	// Make sure to include `https://` when not localhost.
	url = url.includes("http") ? url : `https://${url}`;
	// Ensure path starts without a slash to avoid double slashes in the final URL.
	path = path.replace(/^\/+/, "");

	// Concatenate the URL and the path.
	return path ? `${url}/${path}` : url;
}

export async function fileToBase64({ file }: { file: File }): Promise<string | ArrayBuffer | null> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);

		reader.onload = () => resolve(reader?.["result"]);
		reader.onerror = (error) => reject(error);
	});
}
export async function base64ToBuffer({ base64 }: { base64: string }) {
	const r = base64?.split(",")?.pop();
	if (!r) throw Error("NO BASE64");

	return Buffer.from(r, "base64");
	// return Sharp(Buffer.from(r, "base64")).resize({ width: 800 }).png({ quality: 80 }).toBuffer();
}
export function getMimeType({ base64 }: { base64: string }) {
	const r = base64?.split(",")?.[0];
	if (!r) throw Error("NO MIME TYPE");

	const regex = /^data:(.*?);base64,/;
	const match = base64?.match(regex)!;

	return match[1] ?? null;
}
