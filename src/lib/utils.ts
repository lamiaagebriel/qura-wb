import { aws, AwsUploadProps } from "@/lib/aws";

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

export async function uploadImages({ images, ...props }: { images: string[] } & AwsUploadProps) {
	const imagesWithType = images?.map((img, index) => ({
		image: img,
		type: img.includes("base64,") ? "base64" : "url",
		index, // store the original position
	}));

	// Process base64 images
	const processedImages = await Promise.all(
		imagesWithType.map(async ({ image, type, index }) => {
			if (type === "base64") {
				const uploadedImage = await aws.upload({
					Body: await base64ToBuffer({ base64: image }),
					ContentType: getMimeType({ base64: image }),
					...props,
				});
				return { image: uploadedImage, index };
			} else {
				return { image, index }; // keep URL images as they are
			}
		}),
	);

	// Reorder based on the original index
	return processedImages
		.sort((a, b) => a.index - b.index) // sort by the original position
		.map(({ image }) => image); // get only the image URLs
}
