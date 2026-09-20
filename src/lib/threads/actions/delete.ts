"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";

import { db, schema } from "@/db";
import { getGuardedUser } from "@/lib/auth/guard";
import { getOwnedAuthorIds } from "@/lib/business/queries";
import { fail, messageError, ok, type ActionResult } from "@/lib/errors";
import { isValidId } from "@/lib/id";
import { getLocale } from "@/lib/i18n/actions";
import { deleteThreadImagesByPrefix } from "@/lib/storage/cleanup";

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

  // Also gates the S3 cleanup below on actually owning the root — has to
  // stay just as ownership-gated as the row delete itself, or a request
  // for someone else's `threadId` would happily wipe that thread's
  // images out of S3 while the (correctly-guarded) row delete quietly
  // matched nothing.
  const own = await db.query.threads.findFirst({
    where: and(
      eq(schema.threads.id, threadId),
      inArray(schema.threads.authorId, ownedAuthorIds),
    ),
    columns: { imagePath: true },
  });
  if (!own) return ok(undefined);

  await db
    .delete(schema.threads)
    .where(
      and(
        eq(schema.threads.id, threadId),
        inArray(schema.threads.authorId, ownedAuthorIds),
      ),
    );

  // The entire subtree (however deep) cascades away with the root
  // (`threads.parentId`'s `ON DELETE CASCADE`) — every nested reply's
  // images live under a key prefixed by THIS thread's own `imagePath`
  // (see that column's schema comment), so one S3 prefix list+delete
  // cleans up all of them, at any depth, with no DB walk at all.
  await deleteThreadImagesByPrefix(own.imagePath);

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath(`/profile/${user.username}`);
  revalidatePath(`/thread/${threadId}`);

  return ok(undefined);
}
