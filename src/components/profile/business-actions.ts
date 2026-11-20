"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";

import { businesses, businessLocations } from "@/db/schema";
import { AGAIN, done, fail, invalid, NOT_ALLOWED, ok, type ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/actions/run";
import { getFreshSession } from "@/lib/auth/session";
import { formToBusiness } from "@/lib/business";
import { businessSchema } from "@/lib/validations/business-form";
import {
  allowedRequest,
  allowedStatuses,
  canDelete,
  roleFor,
  requestTarget,
  type BusinessStatus,
  type RequestKind,
} from "@/lib/business-status";
import {
  BUSINESSES_TAG,
  findBusiness,
  getMyBusiness,
} from "@/lib/data/businesses";
import { getPlaceIndex } from "@/lib/data/places";
import { applyStatus, NOT_READY, NotReadyToGoLive } from "@/lib/data/status-writes";
import { rateLimit } from "@/lib/rate-limit";
import { openTicket } from "@/lib/tickets/server";

const isUniqueViolation = (error: unknown) =>
  (error as { cause?: { code?: string } })?.cause?.code === "23505" ||
  (error as { code?: string })?.code === "23505";

/**
 * Creates a business (`editing` = null) or saves one of yours (`editing` =
 * its current @handle). Actions are public endpoints: everything is checked
 * again here with the form's own schema. Saving replaces the business's
 * locations, links and hours in one transaction.
 */
export async function saveBusiness(
  editing: unknown,
  input: unknown,
): Promise<ActionResult<{ requested: boolean }>> {
  const session = await getFreshSession();
  if (!session || session.user.status !== "active") {
    return fail("Please sign in again.");
  }
  const userId = session.user.id;

  if (editing !== null && typeof editing !== "string") {
    return AGAIN;
  }
  if (!(await rateLimit(`save-business:${userId}`, 20, 60 * 60))) {
    return fail("Too many attempts. Please wait a moment.");
  }
  const existing =
    editing === null ? null : await getMyBusiness(editing, userId);
  if (editing !== null && !existing) {
    return fail("This business isn't yours to edit.");
  }

  const parsed = businessSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const values = parsed.data;
  // Places come from the database, so the form's schema can't list them.
  const places = await getPlaceIndex();
  const unknownPlace = values.locations.findIndex(
    (location) => !places.has(location.city),
  );
  if (unknownPlace !== -1) {
    return fail("Choose a city", `locations.${unknownPlace}.city`);
  }
  const taken = fail("This username is taken", "username");

  // Taken: another business has it now. A renamed business's old @handle
  // isn't kept: it's free for anyone right away.
  if (values.username !== editing && (await findBusiness(values.username))) {
    return taken;
  }

  // A new status: applied if this user may set it, recorded as a request
  // if they may only ask for it, refused otherwise — checked before saving.
  let statusChange:
    | { apply: BusinessStatus }
    | { request: RequestKind }
    | null = null;
  if (existing && values.status && values.status !== existing.status) {
    const role = existing.ownedByMe ? "owner" : "creator";
    const kind = allowedRequest(role, existing.status);
    if (allowedStatuses(role, existing.status).includes(values.status))
      statusChange = { apply: values.status };
    else if (kind && requestTarget(kind) === values.status)
      statusChange = { request: kind };
    else return fail("You can't do that.", "status");
  }

  const { socials, locations, hours, ...business } = formToBusiness(values);
  // Only whoever added the business picks its owner: them, or nobody yet
  // (added for someone else). Anyone else editing leaves `ownerId` as is.
  const createdByMe = !existing || existing.createdByMe;
  const record = {
    ...business,
    // New ones go live at once; an edit's status change is applied after
    // the save (`statusChange`).
    ...(!existing && { createdById: userId, status: "active" as const }),
    ...(createdByMe && { ownerId: values.owner === "me" ? userId : null }),
  };

  const actor = { id: userId, status: session.user.status ?? "active" };
  try {
    await runAction(
      {
        action: existing ? "business.update" : "business.create",
        actorId: userId,
        input: { username: values.username, ...(existing && { businessId: existing.id }) },
      },
      async (tx) => {
        // Links and the weekly hours live on the business's row.
        const row = { ...record, links: socials, hours };
        const [{ id }] = existing
          ? await tx.update(businesses).set(row).where(eq(businesses.id, existing.id)).returning({ id: businesses.id })
          : await tx.insert(businesses).values(row).returning({ id: businesses.id });

        // Branches are replaced, in order; each points at its place by id.
        await tx.delete(businessLocations).where(eq(businessLocations.businessId, id));
        await tx.insert(businessLocations).values(
          locations.map(({ description, coords, city }, position) => ({
            businessId: id,
            placeId: places.get(city)!.id,
            position,
            address: description,
            ...coords,
          })),
        );
        if (existing && statusChange && "apply" in statusChange) {
          await applyStatus(tx, { id }, statusChange.apply, userId);
        }
      },
    );
  } catch (error) {
    // Two people claiming the same @handle at once.
    if (isUniqueViolation(error)) return taken;
    if (error instanceof NotReadyToGoLive) return fail(NOT_READY, "status");
    throw error;
  }

  if (existing && statusChange && "request" in statusChange) {
    await openTicket(
      actor,
      statusChange.request === "reopen" ? "reopen_business" : "close_business",
      [{ table: "businesses", id: existing.id }],
      {},
    );
  }

  updateTag(BUSINESSES_TAG);
  if (editing && editing !== values.username) revalidatePath(`/bs/${editing}`);
  revalidatePath(`/bs/${values.username}`, "layout");
  revalidatePath("/c/[slug]", "page");
  revalidatePath("/profile", "layout");
  return ok({ requested: !!statusChange && "request" in statusChange });
}

/**
 * Deletes a business: it gets the `deleted` status (gone from the app, kept
 * 30 days before a purge — a scheduled job, later). Only who `canDelete`
 * allows. Recorded in history.
 */
export async function deleteBusiness(
  username: unknown,
): Promise<ActionResult> {
  const session = await getFreshSession();
  if (!session || session.user.status !== "active") {
    return fail("Please sign in again.");
  }
  if (typeof username !== "string" || !username) {
    return AGAIN;
  }
  const business = await findBusiness(username);
  if (!business) return fail("This business no longer exists.");
  if (!canDelete(roleFor(business, session.user), business.ownerId !== null)) {
    return NOT_ALLOWED;
  }

  await runAction(
    { action: "business.delete", actorId: session.user.id, input: { businessId: business.id } },
    (tx) => tx.update(businesses).set({ status: "deleted" }).where(eq(businesses.id, business.id)),
  );
  updateTag(BUSINESSES_TAG);
  revalidatePath(`/bs/${business.username}`, "layout");
  revalidatePath("/c/[slug]", "page");
  revalidatePath("/profile", "layout");
  return done();
}
