"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { getGuardedUser } from "@/lib/auth/guard";
import {
  fail,
  messageError,
  ok,
  zodIssuesError,
  type ActionResult,
} from "@/lib/errors";
import { isValidId } from "@/lib/id";
import { getLocale } from "@/lib/i18n/actions";
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
  // separate lookup beforehand.
  const [row] = await db
    .update(schema.threads)
    .set({ body: parsed.data.body, images: parsed.data.images })
    .where(
      and(
        eq(schema.threads.id, threadId),
        eq(schema.threads.authorId, user.id),
      ),
    )
    .returning({ id: schema.threads.id, parentId: schema.threads.parentId });

  if (!row) return fail(messageError(t("You can only edit your own threads.")));

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath(`/profile/${user.username}`);
  if (row.parentId) revalidatePath(`/thread/${row.parentId}`);
  revalidatePath(`/thread/${threadId}`);

  return ok(undefined);
}
