"use server";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getFreshSession } from "@/lib/auth/session";
import { isImageType } from "@/lib/post-images";
import { rateLimit } from "@/server/rate-limit";
import { signImageUpload, storageReady } from "@/server/storage";

/**
 * A one-time upload URL for one photo of a post you're writing; the
 * browser PUTs the file there, then sends `url` with the post.
 * `createPost` / `updatePost` only take photos you uploaded.
 */
export async function createImageUpload(
  type: unknown,
): Promise<ActionResult<{ uploadUrl: string; url: string }>> {
  const session = await getFreshSession();
  if (!session || session.user.status !== "active")
    return fail("Please sign in again.");
  if (!storageReady()) return fail("Photos can't be added right now.");
  if (typeof type !== "string" || !isImageType(type)) {
    return fail("Only JPEG, PNG, WebP or GIF photos.");
  }
  // 4 photos a post, 30 posts an hour.
  if (!(await rateLimit(`image:${session.user.id}`, 120, 60 * 60))) {
    return fail("Too many attempts. Please wait a moment.");
  }
  return ok(await signImageUpload(session.user.id, type));
}
