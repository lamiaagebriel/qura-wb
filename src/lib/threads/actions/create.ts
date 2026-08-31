"use server";

import { revalidatePath } from "next/cache";

import { db, schema } from "@/db";
import { getGuardedUser } from "@/lib/auth/guard";
import { getMyBusinessById } from "@/lib/business/queries";
import { getActiveCity } from "@/lib/city/actions";
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

  let authorId = user.id;
  if (parsed.data.asBusinessId) {
    // A business can only ever post its own top-level threads — never
    // reply, so posting "as" one with a `parentId` set is rejected here
    // rather than silently posting as the real account instead.
    if (parsed.data.parentId) {
      return fail(
        messageError(
          t("Business profiles can only post — not reply, follow, or like."),
        ),
      );
    }
    const business = await getMyBusinessById(parsed.data.asBusinessId, user.id);
    if (!business) {
      return fail(messageError(t("Something went wrong. Please try again.")));
    }
    authorId = business.id;
  }

  const city = await getActiveCity();

  const [row] = await db
    .insert(schema.threads)
    .values({
      authorId,
      body: parsed.data.body,
      images: parsed.data.images,
      parentId: parsed.data.parentId ?? null,
      city,
      // A reply's category is never shown, so it's not worth trusting
      // whatever the client sent for one — always `"general"` (the
      // column default) unless this is a genuine new top-level thread.
      category: parsed.data.parentId ? "general" : parsed.data.category,
    })
    .returning({ id: schema.threads.id });

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath(`/profile/${user.username}`);
  if (parsed.data.parentId) revalidatePath(`/thread/${parsed.data.parentId}`);

  return ok({ id: row.id });
}
