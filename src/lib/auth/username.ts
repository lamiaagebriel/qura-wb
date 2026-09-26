import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profiles, users } from "@/db/schema";

const MAX_LENGTH = 20;
const ATTEMPTS = 10;

async function isTaken(username: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (user) return true;

  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);
  return !!profile;
}

/**
 * A free handle derived from a display name ("Omar Hassan" → "omarhassan",
 * then "omarhassan_4821" on collision). Checked against users and profiles,
 * which share one username space.
 */
export async function generateUniqueUsername(name: string): Promise<string> {
  // Remove all spaces to form the base (e.g., "Omar Hassan" → "omarhassan")
  const base =
    name
      .normalize("NFKD")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "") // remove ALL spaces (no underscore)
      .replace(/[^a-z0-9_.]+/g, "")
      .slice(0, MAX_LENGTH) || "user";

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const candidate =
      attempt === 0
        ? base
        : `${base}_${Math.floor(1000 + Math.random() * 9000)}`; // use underscore and 4-digit random number
    if (!(await isTaken(candidate))) return candidate;
  }

  return `${base}_${crypto.randomUUID().slice(0, 8)}`;
}
