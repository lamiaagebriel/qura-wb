"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

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
import { isValidId } from "@/lib/id";
import { getLocale } from "@/lib/i18n/actions";
import {
  createFoodDrinksBlockSchema,
  createGenericBlockSchema,
  createHealthBlockSchema,
  type BusinessBlockValues,
} from "@/lib/validations/business-block";

/** One row per business (`businessId` unique on `business_blocks`), so
 * "set the block" is always an upsert — there's no meaningful
 * create-vs-update distinction the way there is for the business profile
 * itself, since a business either has a category or it doesn't. */
export async function upsertBusinessBlockAction(
  businessId: string,
  values: BusinessBlockValues,
): Promise<ActionResult> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));
  if (!isValidId(businessId)) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  const business = await getMyBusinessById(businessId, user.id);
  if (!business) {
    return fail(
      messageError(t("You can only edit your own business profiles.")),
    );
  }

  const parsed =
    values.category === "food-drinks"
      ? createFoodDrinksBlockSchema(t).safeParse(values)
      : values.category === "health"
        ? createHealthBlockSchema(t).safeParse(values)
        : createGenericBlockSchema(t).safeParse(values);
  if (!parsed.success) return fail(zodIssuesError(parsed.error));

  const { category, ...data } = parsed.data;

  // `city` is only ever set on first insert (deliberately excluded from
  // `set` below) — re-saving your category/details on a later edit
  // shouldn't silently relocate an existing business to whatever city
  // happens to be active in the editor's browser that day.
  const city = await getActiveCity();

  await db
    .insert(schema.businessBlocks)
    .values({ businessId, category, data, city })
    .onConflictDoUpdate({
      target: schema.businessBlocks.businessId,
      set: { category, data },
    });

  revalidatePath(`/profile/${business.username}`);
  revalidatePath("/account/business");
  return ok(undefined);
}

/** "No category" is a real, selectable state (not every business is a
 * restaurant or a doctor) — this is what setting it back to that from
 * the edit form actually does at the data layer. */
export async function clearBusinessBlockAction(
  businessId: string,
): Promise<ActionResult> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));
  if (!isValidId(businessId)) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  const business = await getMyBusinessById(businessId, user.id);
  if (!business) {
    return fail(
      messageError(t("You can only edit your own business profiles.")),
    );
  }

  await db
    .delete(schema.businessBlocks)
    .where(eq(schema.businessBlocks.businessId, businessId));

  revalidatePath(`/profile/${business.username}`);
  revalidatePath("/account/business");
  return ok(undefined);
}
