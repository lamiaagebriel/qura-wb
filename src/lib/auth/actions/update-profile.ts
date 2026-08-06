"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";

import { db, schema } from "@/db";
import {
  fail,
  issueError,
  messageError,
  ok,
  zodIssuesError,
  type ActionResult,
} from "@/lib/errors";
import { getLocale } from "@/lib/i18n/actions";
import {
  createEditProfileSchema,
  type EditProfileValues,
} from "@/lib/validations/profile";

import { getGuardedUser } from "../guard";

export async function updateProfileAction(
  values: EditProfileValues,
): Promise<ActionResult> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));

  const parsed = createEditProfileSchema(t).safeParse(values);
  if (!parsed.success) return fail(zodIssuesError(parsed.error));

  const username = parsed.data.username.toLowerCase();

  const existing = await db.query.users.findFirst({
    where: and(eq(schema.users.username, username), ne(schema.users.id, user.id)),
    columns: { id: true },
  });
  if (existing) {
    return fail(issueError(["username"], t("That username is already taken.")));
  }

  await db
    .update(schema.users)
    .set({ name: parsed.data.name, username, bio: parsed.data.bio || null })
    .where(eq(schema.users.id, user.id));

  revalidatePath("/account");
  return ok(undefined);
}
