"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { users } from "@/db/schema";
import { AGAIN, done, fail, invalid, type ActionResult } from "@/lib/action-result";
import { getFreshSession } from "@/lib/auth/session";
import { isTaken } from "@/lib/auth/username";
import { getGooglePhoto } from "@/lib/data/users";
import { AVATARS, avatarUrl } from "@/lib/profile";
import { profileSchema } from "@/lib/validations/profile-form";
import { rateLimit } from "@/lib/rate-limit";
import { runAction } from "@/lib/actions/run";

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
): Promise<ActionResult> {
  const session = await getFreshSession();
  if (!session || session.user.status !== "active") {
    return fail("Please sign in again.");
  }
  const { user } = session;
  if (!(await rateLimit(`update-profile:${user.id}`, 20, 60 * 60))) {
    return fail("Too many attempts. Please wait a moment.");
  }

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const values = parsed.data;

  if (
    values.image !== null &&
    values.image !== user.image &&
    !PRESETS.has(values.image) &&
    values.image !== (await getGooglePhoto(user.id))
  ) {
    return AGAIN;
  }

  const taken = fail("This username is taken", "username");
  if (values.username !== user.username && (await isTaken(values.username))) {
    return taken;
  }

  try {
    await runAction({ action: "profile.update", actorId: user.id, input: { username: values.username } }, (tx) =>
      tx.update(users).set(values).where(eq(users.id, user.id)),
    );
  } catch (error) {
    // Someone took the @handle at the same moment.
    if (isUniqueViolation(error)) return taken;
    throw error;
  }

  // The session is cached in a cookie: read it fresh so the cookie (and
  // every screen showing your name) picks up the change now.
  await getFreshSession();
  revalidatePath("/profile", "layout");
  return done();
}
