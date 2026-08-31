"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";

import { db, schema } from "@/db";
import { getGuardedUser } from "@/lib/auth/guard";
import { getOwnedAuthorIds } from "@/lib/business/queries";
import { fail, messageError, ok, type ActionResult } from "@/lib/errors";
import { isValidId } from "@/lib/id";
import { getLocale } from "@/lib/i18n/actions";
import { deleteThreadImages } from "@/lib/storage/cleanup";

export async function deleteThreadAction(threadId: string): Promise<ActionResult> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));
  if (!isValidId(threadId)) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  // Ownership check baked into the WHERE rather than a separate lookup —
  // deleting 0 rows (someone else's thread, or one that's already gone) is
  // silently a no-op, which is the right behavior either way. Covers
  // threads authored by one of the signer's own business profiles too.
  const ownedAuthorIds = await getOwnedAuthorIds(user.id);

  // Collected *before* the delete — a top-level thread's replies cascade
  // away with it (`threads.parentId`'s `ON DELETE CASCADE`), and their
  // images need cleaning up from S3 exactly the same as the thread's own,
  // not just the one row this query targets directly.
  const doomed = await db.query.threads.findMany({
    where: and(
      eq(schema.threads.id, threadId),
      inArray(schema.threads.authorId, ownedAuthorIds),
    ),
    columns: { images: true },
    with: { replies: { columns: { images: true } } },
  });

  await db
    .delete(schema.threads)
    .where(
      and(
        eq(schema.threads.id, threadId),
        inArray(schema.threads.authorId, ownedAuthorIds),
      ),
    );

  const allImages = doomed.flatMap((thread) => [
    ...thread.images,
    ...thread.replies.flatMap((reply) => reply.images),
  ]);
  await deleteThreadImages(allImages);

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath(`/profile/${user.username}`);
  revalidatePath(`/thread/${threadId}`);

  return ok(undefined);
}
