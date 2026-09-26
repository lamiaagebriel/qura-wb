import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profiles, users } from "@/db/schema";

/**
 * Creates the user's personal profile if it doesn't exist yet (same
 * username, name and image as the user). Safe to call repeatedly: the
 * one-personal-profile-per-user index makes a second insert a no-op.
 */
export async function ensurePersonalProfile(userId: string) {
  const [user] = await db
    .select({
      name: users.name,
      username: users.username,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return;

  await db
    .insert(profiles)
    .values({
      type: "personal",
      userId,
      username: user.username,
      displayName: user.name,
      image: user.image,
    })
    .onConflictDoNothing();
}
