import "server-only";

import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

import { env } from "@/lib/env";
import { IMAGE_TYPES, type ImageType } from "@/lib/post-images";

/**
 * Post photos in an S3-compatible bucket. The browser uploads each photo
 * straight to the bucket with a one-time signed PUT (never through this
 * server); the post stores the public URLs. Every photo's key is
 * `post-images/{userId}/{uuid}.{ext}`, so a URL alone says who uploaded it
 * (`isOwnImage`) — a post only takes its author's photos.
 */
const PREFIX = "post-images";
const UPLOAD_TTL_SECONDS = 5 * 60;

const config =
  env.S3_BUCKET &&
  env.S3_REGION &&
  env.S3_ACCESS_KEY_ID &&
  env.S3_SECRET_ACCESS_KEY
    ? {
        bucket: env.S3_BUCKET,
        publicUrl:
          env.S3_PUBLIC_URL ??
          `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com`,
      }
    : null;

/** Whether photos can be uploaded at all (else posts are text only). */
export const storageReady = () => config !== null;

let client: S3Client | undefined;
const s3 = () =>
  (client ??= new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    // R2 / MinIO want path-style URLs; AWS takes either.
    forcePathStyle: !!env.S3_ENDPOINT,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    },
  }));

/** A one-time upload URL for one photo of `userId`'s, and where it'll be read from. */
export async function signImageUpload(userId: string, type: ImageType) {
  if (!config)
    throw new Error("Photo storage isn't configured (S3_* variables).");
  const key = `${PREFIX}/${userId}/${randomUUID()}.${IMAGE_TYPES[type]}`;
  const uploadUrl = await getSignedUrl(
    s3(),
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: type,
    }),
    { expiresIn: UPLOAD_TTL_SECONDS },
  );
  return { uploadUrl, url: `${config.publicUrl}/${key}` };
}

/** Our key for a photo URL, or `null` for anything that isn't ours. */
function keyOf(url: string) {
  if (!config || !url.startsWith(`${config.publicUrl}/${PREFIX}/`)) return null;
  return url.slice(config.publicUrl.length + 1);
}

/** A photo `userId` uploaded (`post-images/{userId}/{file}`, nothing deeper). */
export function isOwnImage(url: string, userId: string) {
  const parts = keyOf(url)?.split("/");
  return (
    parts?.length === 3 && parts[1] === userId && /^[\w-]+\.\w+$/.test(parts[2])
  );
}

/**
 * Deletes photos no post uses any more (removed in an edit, or the post
 * deleted). Never throws: a leftover file costs storage, not a failed edit.
 */
export async function deleteImages(urls: string[]) {
  const keys = urls.map(keyOf).filter((key) => key !== null);
  if (!config || !keys.length) return;
  try {
    await s3().send(
      new DeleteObjectsCommand({
        Bucket: config.bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  } catch (error) {
    console.error("Couldn't delete post photos:", error);
  }
}
