"use server";

import { revalidatePath } from "next/cache";

import { getGuardedUser } from "@/lib/auth/guard";
import { getMyBusinessById } from "@/lib/business/queries";
import {
  claimGooglePlaceForBusiness,
  disconnectGooglePlaceForBusiness,
} from "@/lib/business/google-place-claims";
import { isPlausibleGooglePlaceId } from "@/lib/business/google-place-id";
import { fail, messageError, ok, type ActionResult } from "@/lib/errors";
import { isValidId } from "@/lib/id";
import { getLocale } from "@/lib/i18n/actions";

export type ClaimGooglePlaceStatus = "connected" | "already_connected";

export type ClaimGooglePlaceActionData = {
  status: ClaimGooglePlaceStatus;
  // Whether at least one other Qura business is already connected to this
  // same place — purely informational, drives the confirmation UI's
  // "also connected to another Qura profile" messaging. Never a failure.
  conflict: boolean;
};

/**
 * Adds a Google place as one of the caller's own business's branches.
 * `businessId` is never trusted on its own — `getMyBusinessById` re-derives
 * ownership from the signed-in session, same as every sibling action in
 * this directory (`upsert-block.ts`, `delete.ts`), so a request can't
 * connect a place on behalf of a business it doesn't control just by
 * naming its id.
 *
 * Phase 5: connecting to a place another Qura business already holds is
 * not rejected. Phase 24: connecting to a SECOND (or third, ...) place for
 * the SAME business isn't rejected either — a business may now hold
 * several connections at once (`lib/business/google-place-claims.ts`).
 * The only rejectable case left is the caller's own business having no
 * profile block yet.
 */
export async function claimGooglePlaceAction(
  businessId: string,
  googlePlaceId: string,
): Promise<ActionResult<ClaimGooglePlaceActionData>> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));
  if (!isValidId(businessId)) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  const trimmedPlaceId = googlePlaceId.trim();
  if (!isPlausibleGooglePlaceId(trimmedPlaceId)) {
    return fail(messageError(t("Enter a valid Google place."), "google_place_invalid"));
  }

  const business = await getMyBusinessById(businessId, user.id);
  if (!business) {
    return fail(
      messageError(t("You can only edit your own business profiles.")),
    );
  }

  const result = await claimGooglePlaceForBusiness({
    businessId,
    ownerId: user.id,
    googlePlaceId: trimmedPlaceId,
  });

  if (result.status === "connected" || result.status === "already_connected") {
    revalidatePath(`/profile/${business.username}`);
    revalidatePath("/account/business");
    return ok({
      status: result.status,
      conflict: result.status === "connected" ? result.conflict : false,
    });
  }

  // result.status === "no_block"
  return fail(
    messageError(
      t("Set up your business profile before connecting a Google place."),
      "business_block_required",
    ),
  );
}

/** Removes one specific branch connection — has no effect on this
 * business's other branches, or on any other business that may share the
 * same place. */
export async function disconnectGooglePlaceAction(
  businessId: string,
  googlePlaceId: string,
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

  await disconnectGooglePlaceForBusiness(businessId, googlePlaceId.trim());

  revalidatePath(`/profile/${business.username}`);
  revalidatePath("/account/business");
  return ok(undefined);
}
