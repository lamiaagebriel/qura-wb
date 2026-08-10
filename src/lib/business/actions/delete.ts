"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { getGuardedUser } from "@/lib/auth/guard";
import { fail, messageError, ok, type ActionResult } from "@/lib/errors";
import { isValidId } from "@/lib/id";
import { getLocale } from "@/lib/i18n/actions";

export async function deleteBusinessAction(
  businessId: string,
): Promise<ActionResult> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));
  if (!isValidId(businessId)) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  // Cascades handle the rest — the business's threads (`threads.authorId`
  // references `users.id` cascade), the likes on those threads, and its
  // followers (`follows.followingId` cascade) all disappear with it, the
  // same as deleting a real account would. `eq(ownerId, user.id)` alone
  // is the whole ownership+business check — a real account's `ownerId`
  // is always null, so this can only ever match a business you own.
  await db
    .delete(schema.users)
    .where(
      and(eq(schema.users.id, businessId), eq(schema.users.ownerId, user.id)),
    );

  revalidatePath("/account/business");
  return ok(undefined);
}
