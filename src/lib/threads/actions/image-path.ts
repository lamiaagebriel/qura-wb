"use server";

import { getGuardedUser } from "@/lib/auth/guard";
import {
  getThreadImagePath,
  reserveThreadImagePath,
} from "@/lib/threads/image-path";

/** Called once per compose session, right before the first image
 * upload — not per image — so every image in the same new thread/reply
 * lands under the same reserved path. Guarded the same as the upload
 * URL action itself (`createThreadImageUploadUrlAction`): this exists
 * purely to support uploading, so it needs no looser an auth bar than
 * uploading already has. */
export async function reserveThreadIdAction(
  parentId?: string,
): Promise<{ id: string; imagePath: string } | null> {
  const user = await getGuardedUser();
  if (!user) return null;
  return reserveThreadImagePath(parentId);
}

/** The counterpart for editing an EXISTING thread — a newly added image
 * during an edit needs the thread's own already-reserved path, not a
 * fresh one. */
export async function getThreadImagePathAction(
  threadId: string,
): Promise<string | null> {
  const user = await getGuardedUser();
  if (!user) return null;
  return getThreadImagePath(threadId);
}
