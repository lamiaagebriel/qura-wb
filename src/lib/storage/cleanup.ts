import "server-only";

import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

import { db } from "@/db";
import {
  getBucket,
  getS3Client,
  isStorageConfigured,
  keyToUrl,
  THREAD_IMAGES_PREFIX,
  urlToKey,
} from "./s3";

// S3's own batch-delete limit — irrelevant at this app's scale (a
// thread caps at 4 images) but `sweepOrphanedThreadImages` below can
// collect far more than that in one pass, so it still has to chunk.
const DELETE_BATCH_SIZE = 1000;

async function deleteKeys(keys: string[]): Promise<void> {
  if (keys.length === 0 || !isStorageConfigured()) return;
  const client = getS3Client();
  const bucket = getBucket();

  for (let i = 0; i < keys.length; i += DELETE_BATCH_SIZE) {
    const batch = keys.slice(i, i + DELETE_BATCH_SIZE);
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }
}

/**
 * Deletes every given URL from S3 that's actually one of our own
 * objects — silently drops anything else (an external URL, a stale
 * seeded Unsplash photo, or every URL at all if storage isn't
 * configured) via `urlToKey`. Never throws: this always runs as a
 * side effect of a thread create/update/delete or a discarded compose
 * draft, none of which should ever fail *because* image cleanup did —
 * a stray object is a cost-cleanup problem for `sweepOrphanedThreadImages`
 * to catch later, not a reason to break the user-facing action.
 */
export async function deleteThreadImages(urls: string[]): Promise<void> {
  const keys = urls
    .map(urlToKey)
    .filter((key): key is string => key !== null);
  if (keys.length === 0) return;

  try {
    await deleteKeys(keys);
  } catch (err) {
    console.error("Failed to delete thread images from S3:", err);
  }
}

/**
 * Deletes every S3 object nested under `thread-images/{imagePath}/` —
 * the entire delete-thread cleanup story for a thread that has a
 * reserved `imagePath` (see `threads.imagePath`'s schema comment and
 * `lib/threads/actions/delete.ts`), in one list+delete pass with no
 * recursive walk of the reply tree: any nested reply's images, however
 * many levels deep, live under a key that's already prefixed by this
 * thread's own path, so listing that one prefix finds all of them
 * regardless of depth. The `do`/`while` here is S3's own pagination
 * (bounded by object count, 1000/page) — not a stand-in for the DB-tree
 * recursion this replaces.
 */
export async function deleteThreadImagesByPrefix(
  imagePath: string,
): Promise<void> {
  if (!isStorageConfigured()) return;
  const client = getS3Client();
  const bucket = getBucket();
  const prefix = `${THREAD_IMAGES_PREFIX}/${imagePath}/`;

  const keys: string[] = [];
  let continuationToken: string | undefined;

  try {
    do {
      const page = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );
      for (const obj of page.Contents ?? []) {
        if (obj.Key) keys.push(obj.Key);
      }
      continuationToken = page.IsTruncated
        ? page.NextContinuationToken
        : undefined;
    } while (continuationToken);

    await deleteKeys(keys);
  } catch (err) {
    // Same "never break the user-facing action" rule as
    // `deleteThreadImages` — the thread row itself is either already
    // gone or about to be regardless; a storage hiccup here is
    // `sweepOrphanedThreadImages`'s problem to catch later, not a
    // reason to fail the delete.
    console.error("Failed to delete thread image subtree from S3:", err);
  }
}

// An upload only counts as orphaned once it's had time to actually be
// attached to a thread — otherwise a slow upload mid-compose could get
// swept out from under a post that's about to reference it.
const ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * The safety net behind `deleteThreadImages`'s immediate, diff-based
 * cleanup: anything that slipped through (a browser closed mid-compose
 * before the "discard" cleanup could run, a crashed request) sits in S3
 * forever otherwise. Scheduled daily from `/api/cron/cleanup` — lists
 * every object under `thread-images/`, diffs against every URL any
 * thread currently references, and deletes whatever's left over and
 * old enough to be safely considered abandoned.
 */
export async function sweepOrphanedThreadImages(): Promise<{
  checked: number;
  deleted: number;
}> {
  if (!isStorageConfigured()) return { checked: 0, deleted: 0 };
  const client = getS3Client();
  const bucket = getBucket();

  // Small enough at this app's scale to hold every referenced URL in
  // memory and diff directly, rather than a per-object existence query
  // for each one.
  const rows = await db.query.threads.findMany({ columns: { images: true } });
  const referenced = new Set(rows.flatMap((r) => r.images));

  const cutoff = Date.now() - ORPHAN_MIN_AGE_MS;
  const orphanedKeys: string[] = [];
  let checked = 0;
  let continuationToken: string | undefined;

  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `${THREAD_IMAGES_PREFIX}/`,
        ContinuationToken: continuationToken,
      }),
    );

    for (const obj of page.Contents ?? []) {
      if (!obj.Key || !obj.LastModified) continue;
      checked++;
      const stillReferenced = referenced.has(keyToUrl(obj.Key));
      if (!stillReferenced && obj.LastModified.getTime() < cutoff) {
        orphanedKeys.push(obj.Key);
      }
    }

    continuationToken = page.IsTruncated
      ? page.NextContinuationToken
      : undefined;
  } while (continuationToken);

  await deleteKeys(orphanedKeys);
  return { checked, deleted: orphanedKeys.length };
}
