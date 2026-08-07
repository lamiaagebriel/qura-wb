"use server";

import { revalidatePath } from "next/cache";

import { db, schema } from "@/db";
import { getGuardedUser } from "@/lib/auth/guard";
import {
  fail,
  messageError,
  ok,
  zodIssuesError,
  type ActionResult,
} from "@/lib/errors";
import { getLocale } from "@/lib/i18n/actions";
import { createThreadSchema, type ThreadValues } from "@/lib/validations/thread";

export async function createThreadAction(
  values: ThreadValues,
): Promise<ActionResult<{ id: string }>> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));

  const parsed = createThreadSchema(t).safeParse(values);
  if (!parsed.success) return fail(zodIssuesError(parsed.error));

  const [row] = await db
    .insert(schema.threads)
    .values({
      authorId: user.id,
      body: parsed.data.body,
      images: parsed.data.images,
      parentId: parsed.data.parentId ?? null,
    })
    .returning({ id: schema.threads.id });

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath(`/profile/${user.username}`);
  if (parsed.data.parentId) revalidatePath(`/thread/${parsed.data.parentId}`);

  return ok({ id: row.id });
}
