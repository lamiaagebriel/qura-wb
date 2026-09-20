"use server";

import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getGuardedUser } from "@/lib/auth/guard";
import { fail, messageError, ok, type ActionResult } from "@/lib/errors";
import { getLocale } from "@/lib/i18n/actions";

import { deleteThreadImages } from "./cleanup";
import {
  getBucket,
  getS3Client,
  isStorageConfigured,
  keyToUrl,
  THREAD_IMAGES_PREFIX,
  urlToKey,
} from "./s3";

// Presigned PUT can't enforce a size limit server-side the way a
// presigned POST policy could — `ImageUploadField` rejects an
// oversized file before ever requesting a URL, which is enough for this
// app's scale even though it isn't a hard server-side guarantee.
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const UPLOAD_URL_TTL_SECONDS = 5 * 60;

/**
 * One presigned S3 PUT URL for one image — the client uploads the file
 * bytes directly to S3 from the browser (never through this server),
 * this just authorizes exactly one `PUT` to exactly one fresh key under
 * `{imagePath}` — the thread's own reserved S3 ancestry (see
 * `lib/threads/image-path.ts`; the caller reserves it once per compose
 * session and passes the same value for every image in that thread).
 * The uploader's own id sits right before the filename
 * (`thread-images/{imagePath}/{userId}/{uuid}.ext`), not right after the
 * prefix like before — deliberately, so a delete-thread's S3 prefix
 * (`thread-images/{imagePath}/`) still captures every reply's images
 * underneath it even when different replies were uploaded by different
 * users, while `discardThreadImagesAction` below can still verify "is
 * this actually mine" from the key alone. The returned `publicUrl` is
 * what actually ends up in a thread's `images` array once the
 * composer's upload succeeds.
 */
export async function createThreadImageUploadUrlAction(
  contentType: string,
  imagePath: string,
): Promise<ActionResult<{ uploadUrl: string; publicUrl: string }>> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));

  if (!isStorageConfigured()) {
    return fail(messageError(t("Image uploads aren't set up yet.")));
  }

  const extension = ALLOWED_TYPES[contentType];
  if (!extension) {
    return fail(messageError(t("Only JPEG, PNG, WebP, or GIF images are allowed.")));
  }

  const key = `${THREAD_IMAGES_PREFIX}/${imagePath}/${user.id}/${randomUUID()}.${extension}`;
  const uploadUrl = await getSignedUrl(
    getS3Client(),
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS },
  );

  return ok({ uploadUrl, publicUrl: keyToUrl(key) });
}

/**
 * Cleans up images the composer already uploaded during this session but
 * never actually got published — backing out of a new thread, or
 * removing an image before hitting Post. Restricted to keys this user
 * actually uploaded (never trusts the client-supplied URLs otherwise) so
 * this can't be used to delete anyone else's images.
 *
 * The uploader's id is the second-to-last key segment now (right before
 * the filename — see `createThreadImageUploadUrlAction`'s own comment on
 * why it moved there), not a fixed prefix right after
 * `thread-images/` — `imagePath` sits between them and varies in depth
 * (a top-level thread's own id, or a whole reply-chain nested under
 * it), so "is this mine" has to check that specific segment rather than
 * a `startsWith` prefix match.
 */
export async function discardThreadImagesAction(
  urls: string[],
): Promise<ActionResult> {
  const user = await getGuardedUser();
  if (!user) return ok(undefined); // Nothing to clean up for a signed-out caller.

  const ownUrls = urls.filter((url) => {
    const key = urlToKey(url);
    if (key === null) return false;
    const segments = key.split("/");
    return segments.at(-2) === user.id;
  });

  await deleteThreadImages(ownUrls);
  return ok(undefined);
}
