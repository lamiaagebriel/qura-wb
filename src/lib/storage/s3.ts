import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

// Every thread-image object lives under this one prefix in the bucket,
// namespaced by uploader id below it (`thread-images/{userId}/{uuid}.ext`)
// — lets `sweepOrphanedThreadImages` (`./cleanup.ts`) list just these
// objects without scanning the whole bucket, and keeps this feature's
// objects clearly separated from anything else that might ever share
// the bucket.
export const THREAD_IMAGES_PREFIX = "thread-images";

type StorageConfig = {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl: string;
};

function readConfig(): StorageConfig | null {
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!region || !bucket || !accessKeyId || !secretAccessKey) return null;

  // Defaults to the bucket's own regional endpoint; override with
  // `AWS_S3_PUBLIC_URL` to serve through a CloudFront distribution (or
  // any other CDN/proxy) instead — same object, just a different URL
  // shape in front of it.
  const publicUrl = (
    process.env.AWS_S3_PUBLIC_URL ?? `https://${bucket}.s3.${region}.amazonaws.com`
  ).replace(/\/$/, "");

  return { region, bucket, accessKeyId, secretAccessKey, publicUrl };
}

/** Whether image storage has actually been set up — every entry point
 * that touches S3 (`actions.ts`, `cleanup.ts`) checks this first and
 * degrades gracefully instead of throwing, since the rest of the thread
 * CRUD flow (text-only posts, editing, deleting) has to keep working
 * even before this is configured. */
export function isStorageConfigured(): boolean {
  return readConfig() !== null;
}

// Built lazily (not at module load) and cached — constructing `S3Client`
// eagerly at import time would mean every file that imports this module
// (including ones reachable with storage never configured) throws
// immediately, instead of only the specific operation that actually
// needs it.
let cached: { client: S3Client; config: StorageConfig } | null = null;

function getStorage(): { client: S3Client; config: StorageConfig } {
  const config = readConfig();
  if (!config) {
    throw new Error(
      "Image storage isn't configured — set AWS_REGION, AWS_S3_BUCKET, " +
        "AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY.",
    );
  }
  if (!cached || cached.config.bucket !== config.bucket) {
    cached = {
      client: new S3Client({
        region: config.region,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      }),
      config,
    };
  }
  return cached;
}

export function getS3Client(): S3Client {
  return getStorage().client;
}

export function getBucket(): string {
  return getStorage().config.bucket;
}

export function keyToUrl(key: string): string {
  return `${getStorage().config.publicUrl}/${key}`;
}

/** The inverse of `keyToUrl` — `null` for anything that isn't actually
 * one of our own objects (an external URL, a stale seeded Unsplash
 * photo, or any URL at all if storage isn't configured), which callers
 * treat as "nothing to delete" rather than an error. */
export function urlToKey(url: string): string | null {
  const config = readConfig();
  if (!config) return null;
  const prefix = `${config.publicUrl}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}
