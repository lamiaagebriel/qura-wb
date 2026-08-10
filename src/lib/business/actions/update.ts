"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";

import { db, schema } from "@/db";
import { getGuardedUser } from "@/lib/auth/guard";
import {
  fail,
  issueError,
  ok,
  messageError,
  zodIssuesError,
  type ActionResult,
} from "@/lib/errors";
import { isValidId } from "@/lib/id";
import { getLocale } from "@/lib/i18n/actions";
import {
  createBusinessSchema,
  type BusinessValues,
} from "@/lib/validations/business";

export async function updateBusinessAction(
  businessId: string,
  values: BusinessValues,
): Promise<ActionResult> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));
  if (!isValidId(businessId)) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  const parsed = createBusinessSchema(t).safeParse(values);
  if (!parsed.success) return fail(zodIssuesError(parsed.error));

  const username = parsed.data.username.toLowerCase();

  const existing = await db.query.users.findFirst({
    where: and(
      eq(schema.users.username, username),
      ne(schema.users.id, businessId),
    ),
    columns: { id: true },
  });
  if (existing) {
    return fail(issueError(["username"], t("That username is already taken.")));
  }

  // Ownership check baked into the WHERE, same pattern as
  // `updateThreadAction` — updating 0 rows (not yours, or not a business
  // at all) is the signal to fail, not a separate lookup beforehand.
  // `eq(ownerId, user.id)` alone already means "yours and a business" —
  // a real account's own `ownerId` is always null.
  const [row] = await db
    .update(schema.users)
    .set({ name: parsed.data.name, username, bio: parsed.data.bio || null })
    .where(
      and(eq(schema.users.id, businessId), eq(schema.users.ownerId, user.id)),
    )
    .returning({ id: schema.users.id, username: schema.users.username });

  if (!row) {
    return fail(
      messageError(t("You can only edit your own business profiles.")),
    );
  }

  revalidatePath("/account/business");
  revalidatePath(`/profile/${row.username}`);
  return ok(undefined);
}
