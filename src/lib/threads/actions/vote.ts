"use server";

import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { getGuardedUser } from "@/lib/auth/guard";
import { fail, messageError, ok, type ActionResult } from "@/lib/errors";
import { isValidId } from "@/lib/id";
import { getLocale } from "@/lib/i18n/actions";

/** Casts (or flips) a "helpful" / "not helpful" vote — separate from
 * the private `saveThreadAction` bookmark, this is the public signal
 * that rolls up into `markedUnhelpful` (see `lib/threads/queries.ts`).
 * Voting the same way you already voted takes the vote back instead of
 * erroring, matching how the client toggles it — there's no separate
 * "unvote" action to keep in sync.
 *
 * No `revalidatePath` here: `ThreadCard` already applies the new vote
 * optimistically through the shared `useThreadOverride` store (so every
 * mounted copy of this thread's card updates immediately, no reload),
 * and this page is fully dynamic (reads cookies for auth/city) so
 * there's no route cache actually going stale to invalidate —
 * `revalidatePath` here only forced an unwanted full feed refetch on
 * every vote. */
export async function voteThreadAction(
  threadId: string,
  value: 1 | -1,
): Promise<ActionResult> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));
  if (!isValidId(threadId)) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  const existing = await db.query.threadVotes.findFirst({
    where: and(
      eq(schema.threadVotes.userId, user.id),
      eq(schema.threadVotes.threadId, threadId),
    ),
    columns: { value: true },
  });

  if (existing?.value === value) {
    await db
      .delete(schema.threadVotes)
      .where(
        and(
          eq(schema.threadVotes.userId, user.id),
          eq(schema.threadVotes.threadId, threadId),
        ),
      );
  } else {
    await db
      .insert(schema.threadVotes)
      .values({ userId: user.id, threadId, value })
      .onConflictDoUpdate({
        target: [schema.threadVotes.userId, schema.threadVotes.threadId],
        set: { value },
      });
  }

  return ok(undefined);
}
