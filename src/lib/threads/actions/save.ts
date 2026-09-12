"use server";

import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { getGuardedUser } from "@/lib/auth/guard";
import { fail, messageError, ok, type ActionResult } from "@/lib/errors";
import { isValidId } from "@/lib/id";
import { getLocale } from "@/lib/i18n/actions";

// No `revalidatePath` in either action below: `ThreadCard` already
// flips its saved state optimistically through the shared
// `useThreadOverride` store, which every mounted copy of this thread's
// card reads from — so save/unsave shows up everywhere immediately with
// no reload. Forcing a route refetch here would only undo that by
// resetting the feed's scroll position back to the top.
export async function saveThreadAction(threadId: string): Promise<ActionResult> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));
  if (!isValidId(threadId)) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  await db
    .insert(schema.threadSaves)
    .values({ userId: user.id, threadId })
    .onConflictDoNothing();

  return ok(undefined);
}

export async function unsaveThreadAction(threadId: string): Promise<ActionResult> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));
  if (!isValidId(threadId)) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  await db
    .delete(schema.threadSaves)
    .where(
      and(
        eq(schema.threadSaves.userId, user.id),
        eq(schema.threadSaves.threadId, threadId),
      ),
    );

  return ok(undefined);
}
