"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { getGuardedAdmin } from "@/lib/auth/guard";
import { fail, messageError, ok, type ActionResult } from "@/lib/errors";
import { isValidId } from "@/lib/id";
import { getLocale } from "@/lib/i18n/actions";

/**
 * The only two ways an admin can update a conflict record's `status` —
 * both are pure triage bookkeeping. Neither ever touches
 * `business_blocks`: resolving/dismissing a conflict is a separate
 * decision from disconnecting a business, exactly per the Phase 5 spec
 * ("admin review and connection mutation should remain separate"). If a
 * business's connection needs to change, that still only ever happens
 * through `disconnectGooglePlaceAction`, called by that business's own
 * owner.
 *
 * `getGuardedAdmin` is the entire authorization boundary — no client-side
 * role check exists anywhere; calling this action directly as a
 * non-admin fails here, server-side, regardless of what UI (or lack of
 * one) the caller went through.
 */
async function setConflictStatus(
  id: string,
  status: "resolved" | "dismissed",
): Promise<ActionResult> {
  const [admin, { t }] = await Promise.all([getGuardedAdmin(), getLocale()]);
  if (!admin) return fail(messageError(t("You need to sign in to do that.")));
  if (!isValidId(id)) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  await db
    .update(schema.googlePlaceClaimConflicts)
    .set({ status })
    .where(eq(schema.googlePlaceClaimConflicts.id, id));

  revalidatePath("/admin/google-place-conflicts");
  return ok(undefined);
}

export async function resolveGooglePlaceConflictAction(
  id: string,
): Promise<ActionResult> {
  return setConflictStatus(id, "resolved");
}

export async function dismissGooglePlaceConflictAction(
  id: string,
): Promise<ActionResult> {
  return setConflictStatus(id, "dismissed");
}
