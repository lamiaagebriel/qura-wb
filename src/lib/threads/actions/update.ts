"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";

import { db, schema } from "@/db";
import { getGuardedUser } from "@/lib/auth/guard";
import { getOwnedAuthorIds } from "@/lib/business/queries";
import {
  fail,
  messageError,
  ok,
  zodIssuesError,
  type ActionResult,
} from "@/lib/errors";
import { isValidId } from "@/lib/id";
import { getLocale } from "@/lib/i18n/actions";
import { deleteThreadImages } from "@/lib/storage/cleanup";
import {
  createThreadSchema,
  type ThreadValues,
} from "@/lib/validations/thread";

export async function updateThreadAction(
  threadId: string,
  values: Pick<ThreadValues, "body" | "images">,
): Promise<ActionResult> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));
  if (!isValidId(threadId)) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  const parsed = createThreadSchema(t)
    .pick({ body: true, images: true })
    .safeParse(values);
  if (!parsed.success) return fail(zodIssuesError(parsed.error));

  // Ownership check baked into the WHERE, same as `deleteThreadAction` —
  // updating 0 rows (someone else's thread) is the signal to fail, not a
  // separate lookup beforehand. `ownedAuthorIds` covers both "this is
  // your own thread" and "this is one of your business profiles'
  // threads" — a business-authored row's `authorId` is the business's
  // own id, not yours.
  const ownedAuthorIds = await getOwnedAuthorIds(user.id);

  // Read before the update, not after — `UPDATE ... RETURNING` only ever
  // hands back the *new* row, and diffing against the old `images` is
  // the whole point: anything dropped from the array is deleted from S3
  // right below, so a thread's images in storage never outlive their
  // last reference in `images` itself.
  const existing = await db.query.threads.findFirst({
    where: and(
      eq(schema.threads.id, threadId),
      inArray(schema.threads.authorId, ownedAuthorIds),
    ),
    columns: { images: true },
  });
  if (!existing) {
    return fail(messageError(t("You can only edit your own threads.")));
  }

  const [row] = await db
    .update(schema.threads)
    .set({ body: parsed.data.body, images: parsed.data.images })
    .where(
      and(
        eq(schema.threads.id, threadId),
        inArray(schema.threads.authorId, ownedAuthorIds),
      ),
    )
    .returning({ id: schema.threads.id, parentId: schema.threads.parentId });

  if (!row) return fail(messageError(t("You can only edit your own threads.")));

  const removedImages = existing.images.filter(
    (url) => !parsed.data.images.includes(url),
  );
  await deleteThreadImages(removedImages);

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath(`/profile/${user.username}`);
  if (row.parentId) revalidatePath(`/thread/${row.parentId}`);
  revalidatePath(`/thread/${threadId}`);

  return ok(undefined);
}
