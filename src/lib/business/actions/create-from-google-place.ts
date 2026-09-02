"use server";

import { revalidatePath } from "next/cache";

import { getGuardedUser } from "@/lib/auth/guard";
import {
  checkExistingGooglePlaceConversion,
  createBusinessFromGooglePlace,
  type CreateBusinessFromGooglePlaceData,
  type CreateBusinessFromGooglePlaceInput,
} from "@/lib/business/google-place-conversion";
import { fail, messageError, ok, type ActionResult } from "@/lib/errors";
import { getLocale } from "@/lib/i18n/actions";

export type {
  CreateBusinessFromGooglePlaceData,
  CreateBusinessFromGooglePlaceInput,
} from "@/lib/business/google-place-conversion";

/**
 * Click-time pre-check for the "Add to Qura" affordance on a `kind:
 * "google"` search result. The result may be shown to a signed-out
 * visitor, so this can't run before the button is even shown (Phase 20's
 * original "server-side, before the form" design didn't account for
 * that) — instead the UI calls this the moment "Add to Qura" is clicked,
 * and only opens the creation form if it comes back with `existing: null`.
 *
 * Re-run (not trusted from the client) inside
 * `createBusinessFromGooglePlaceAction` itself before it writes anything,
 * since the time between this click and the final confirm is an
 * arbitrary amount of user think-time.
 */
export async function checkGooglePlaceConversionAction(
  placeId: string,
): Promise<ActionResult<{ existing: { id: string; username: string } | null }>> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));

  const existing = await checkExistingGooglePlaceConversion(user.id, placeId);
  return ok({ existing });
}

/**
 * Creates a brand-new Qura business profile from a Google-only search
 * result and connects it to that place, in one atomic step — see
 * `lib/business/google-place-conversion.ts` for the actual logic. This
 * wrapper's only job is deriving `ownerId` from the signed-in session
 * (never trusted from the client) before delegating.
 */
export async function createBusinessFromGooglePlaceAction(
  input: CreateBusinessFromGooglePlaceInput,
): Promise<ActionResult<CreateBusinessFromGooglePlaceData>> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));

  const result = await createBusinessFromGooglePlace(user.id, input, t);

  if (result.success && result.data.status === "created") {
    revalidatePath(`/profile/${result.data.username}`);
    revalidatePath("/account/business");
  }

  return result;
}
