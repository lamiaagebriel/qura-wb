"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getFreshSession } from "@/lib/auth/session";
import { isTaken } from "@/lib/auth/username";
import { getGooglePhoto } from "@/lib/data/users";
import type { MessageKey } from "@/lib/i18n/types";
import { AVATARS, avatarUrl, profileSchema } from "@/lib/profile";
import { rateLimit } from "@/lib/rate-limit";

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; fields?: Record<string, MessageKey>; form?: MessageKey };

const PRESETS = new Set<string>(AVATARS.map(({ id }) => avatarUrl(id)));

const isUniqueViolation = (error: unknown) =>
  (error as { cause?: { code?: string } })?.cause?.code === "23505";

/**
 * Saves your name, @handle, bio and avatar. Actions are public endpoints:
 * everything is checked again with the form's schema, and the avatar must
 * be a preset, your Google photo, or the one you already have.
 */
export async function updateProfile(
  input: unknown,
): Promise<UpdateProfileResult> {
  const session = await getFreshSession();
  if (!session || session.user.status === "suspended") {
    return { ok: false, form: "Please sign in again." };
  }
  const { user } = session;
  if (!(await rateLimit(`update-profile:${user.id}`, 20, 60 * 60))) {
    return { ok: false, form: "Too many attempts. Please wait a moment." };
  }

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, MessageKey> = {};
    for (const issue of parsed.error.issues) {
      fields[issue.path.join(".")] ??= issue.message as MessageKey;
    }
    return { ok: false, fields };
  }
  const values = parsed.data;

  if (
    values.image !== null &&
    values.image !== user.image &&
    !PRESETS.has(values.image) &&
    values.image !== (await getGooglePhoto(user.id))
  ) {
    return { ok: false, form: "Something went wrong. Please try again." };
  }

  const taken = {
    ok: false,
    fields: { username: "This username is taken" },
  } as const;
  if (values.username !== user.username && (await isTaken(values.username))) {
    return taken;
  }

  try {
    await db.update(users).set(values).where(eq(users.id, user.id));
  } catch (error) {
    // Someone took the @handle at the same moment.
    if (isUniqueViolation(error)) return taken;
    throw error;
  }

  // The session is cached in a cookie: read it fresh so the cookie (and
  // every screen showing your name) picks up the change now.
  await getFreshSession();
  revalidatePath("/profile", "layout");
  return { ok: true };
}
