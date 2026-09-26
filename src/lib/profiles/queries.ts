import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { profiles } from "@/db/schema";

export async function getPersonalProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.userId, userId), eq(profiles.type, "personal")))
    .limit(1);
  return profile ?? null;
}
