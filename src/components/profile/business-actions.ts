"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";

import { db } from "@/db";
import {
  businesses,
  businessHours,
  businessLinks,
  businessLocations,
} from "@/db/schema";
import { getFreshSession } from "@/lib/auth/session";
import { businessSchema, formToBusiness } from "@/lib/business";
import {
  BUSINESSES_TAG,
  findBusiness,
  getMyBusiness,
} from "@/lib/data/businesses";
import type { MessageKey } from "@/lib/i18n/types";
import { rateLimit } from "@/lib/rate-limit";

export type SaveBusinessResult =
  | { ok: true }
  /**
   * `fields`: field path ("name.en", "locations.0.pin") → message;
   * `form`: what went wrong with the whole save.
   */
  | { ok: false; fields?: Record<string, MessageKey>; form?: MessageKey };

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
): Promise<SaveBusinessResult> {
  const session = await getFreshSession();
  if (!session || session.user.status === "suspended") {
    return { ok: false, form: "Please sign in again." };
  }
  const userId = session.user.id;

  if (editing !== null && typeof editing !== "string") {
    return { ok: false, form: "Something went wrong. Please try again." };
  }
  if (!(await rateLimit(`save-business:${userId}`, 20, 60 * 60))) {
    return { ok: false, form: "Too many attempts. Please wait a moment." };
  }
  const existing =
    editing === null ? null : await getMyBusiness(editing, userId);
  if (editing !== null && !existing) {
    return { ok: false, form: "This business isn't yours to edit." };
  }

  const parsed = businessSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, MessageKey> = {};
    for (const issue of parsed.error.issues) {
      fields[issue.path.join(".")] ??= issue.message as MessageKey;
    }
    return { ok: false, fields };
  }
  const values = parsed.data;
  const taken = {
    ok: false,
    fields: { username: "This username is taken" },
  } as const;

  if (
    values.username !== editing &&
    (await findBusiness(values.username))
  ) {
    return taken;
  }

  const { socials, locations, hours, ...business } = formToBusiness(values);
  // Only whoever added the business picks its owner: them, or nobody yet
  // (added for someone else). Anyone else editing leaves `ownerId` as is.
  const createdByMe = !existing || existing.createdByMe;
  const record = {
    ...business,
    ...(!existing && { createdById: userId }),
    ...(createdByMe && { ownerId: values.owner === "me" ? userId : null }),
  };

  try {
    await db.transaction(async (tx) => {
      const [{ id }] = existing
        ? await tx
            .update(businesses)
            .set(record)
            .where(eq(businesses.id, existing.id))
            .returning({ id: businesses.id })
        : await tx
            .insert(businesses)
            .values(record)
            .returning({ id: businesses.id });

      await Promise.all([
        tx
          .delete(businessLocations)
          .where(eq(businessLocations.businessId, id)),
        tx.delete(businessLinks).where(eq(businessLinks.businessId, id)),
        tx.delete(businessHours).where(eq(businessHours.businessId, id)),
      ]);
      await Promise.all([
        tx.insert(businessLocations).values(
          locations.map(({ description, coords }, position) => ({
            businessId: id,
            position,
            address: description,
            ...coords,
          })),
        ),
        tx.insert(businessLinks).values(
          socials.map(({ platform, url }, position) => ({
            businessId: id,
            position,
            platform,
            url,
          })),
        ),
        ...(hours.some(Boolean)
          ? [
              tx
                .insert(businessHours)
                .values(
                  hours.flatMap((slot, day) =>
                    slot
                      ? [
                          {
                            businessId: id,
                            day,
                            opens: slot.open,
                            closes: slot.close,
                          },
                        ]
                      : [],
                  ),
                ),
            ]
          : []),
      ]);
    });
  } catch (error) {
    // Two people claiming the same @handle at once.
    if (isUniqueViolation(error)) return taken;
    throw error;
  }

  updateTag(BUSINESSES_TAG);
  if (editing && editing !== values.username) revalidatePath(`/bs/${editing}`);
  revalidatePath(`/bs/${values.username}`, "layout");
  revalidatePath("/c/[slug]", "page");
  revalidatePath("/profile", "layout");
  return { ok: true };
}
