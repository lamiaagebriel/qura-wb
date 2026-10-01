"use server";

import {
  fakeMyBusiness,
  fakeUsernameTaken,
} from "@/components/profile/fake-businesses";
import { getFreshSession } from "@/lib/auth/session";
import { isTaken } from "@/lib/auth/username";
import { businessSchema, formToBusiness } from "@/lib/business";
import type { MessageKey } from "@/lib/i18n/types";

export type SaveBusinessResult =
  | { ok: true }
  /**
   * `fields`: field path ("name.en", "locations.0.pin") → message;
   * `form`: what went wrong with the whole save.
   */
  | { ok: false; fields?: Record<string, MessageKey>; form?: MessageKey };

/**
 * Creates a business (`editing` = null) or saves one of yours (`editing` =
 * its current @handle). Actions are public endpoints: everything is checked
 * again here with the form's own schema.
 * TEMPORARY: checks against the fake businesses and doesn't store anything,
 * until businesses are stored.
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
  const existing = editing === null ? null : fakeMyBusiness(editing);
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

  if (
    values.username !== editing &&
    (fakeUsernameTaken(values.username) || (await isTaken(values.username)))
  ) {
    return { ok: false, fields: { username: "This username is taken" } };
  }

  // Only whoever added the business picks its owner: them, or nobody yet
  // (added for someone else). Anyone else editing leaves `ownerId` as is.
  const createdByMe = !existing || existing.createdByMe;
  const record = {
    ...formToBusiness(values),
    ...(!existing && { createdBy: userId }),
    ...(createdByMe && { ownerId: values.owner === "me" ? userId : null }),
  };
  // TODO: insert / update the business profile once businesses are stored.
  void record;

  return { ok: true };
}
