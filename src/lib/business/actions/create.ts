"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

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
import { getLocale } from "@/lib/i18n/actions";
import {
  createBusinessSchema,
  type BusinessValues,
} from "@/lib/validations/business";

export async function createBusinessAction(
  values: BusinessValues,
): Promise<ActionResult<{ id: string; username: string }>> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));

  const parsed = createBusinessSchema(t).safeParse(values);
  if (!parsed.success) return fail(zodIssuesError(parsed.error));

  const username = parsed.data.username.toLowerCase();

  const existing = await db.query.users.findFirst({
    where: eq(schema.users.username, username),
    columns: { id: true },
  });
  if (existing) {
    return fail(issueError(["username"], t("That username is already taken.")));
  }

  const [business] = await db
    .insert(schema.users)
    .values({
      ownerId: user.id,
      name: parsed.data.name,
      username,
      bio: parsed.data.bio || null,
      // Business rows are never logged into directly — no `accounts` row
      // is ever created for one, which is what actually prevents signing
      // in as it. This email only exists to satisfy `users.email`'s
      // `NOT NULL UNIQUE` constraint (Better Auth's own schema); it's
      // never sent to, never shown, and never used to look anyone up.
      email: `business+${randomUUID()}@business.internal.qura`,
      emailVerified: true,
      status: "active",
    })
    .returning({ id: schema.users.id, username: schema.users.username });

  if (!business) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  revalidatePath("/account/business");
  return ok(business);
}
