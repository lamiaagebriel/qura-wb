import { eq } from "drizzle-orm";

import { db, schema } from "@/db";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Threads/Instagram-style handle chars only. Collapse everything else so a
// name like "Jane O'Cooper 🎉" still produces a usable slug instead of an
// empty string.
const USERNAME_SLUG_RE = /[^a-z0-9_.]+/g;
const MAX_SLUG_LENGTH = 20;
const MAX_GENERATION_ATTEMPTS = 20;

/**
 * Derives a unique `username` from a display name at account-creation time
 * (see the `user.create` databaseHook in `lib/auth/auth.ts`). Never throws
 * on collision — falls back to a fully random suffix on the last attempt
 * rather than leaving sign-up broken over a taken handle.
 */
export async function generateUniqueUsername(name: string): Promise<string> {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(USERNAME_SLUG_RE, "")
      .slice(0, MAX_SLUG_LENGTH) || "user";

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = attempt === 0 ? base : `${base}${suffix}`;

    const existing = await db.query.users.findFirst({
      where: eq(schema.users.username, candidate),
      columns: { id: true },
    });
    if (!existing) return candidate;
  }

  // Astronomically unlikely to be reached, but a bounded loop needs a
  // guaranteed exit — a full random suffix has negligible collision odds.
  return `${base}_${Math.random().toString(36).slice(2, 10)}`;
}
