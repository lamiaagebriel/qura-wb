import "server-only";

import { lt } from "drizzle-orm";

import { db, schema } from "@/db";

/**
 * Neither `sessions` nor `verifications` has any built-in expiry sweep —
 * Better Auth just treats an expired row as invalid when it happens to be
 * read, it never deletes it. Left alone, both tables grow forever: every
 * sign-in, sign-up, and OAuth attempt leaves a row behind even once it's
 * long past `expiresAt`.
 *
 * Wired up as a scheduled job — see `app/api/cron/cleanup/route.ts` and
 * `vercel.json` — rather than run on every request, since it's pure
 * housekeeping with no user-facing urgency.
 */
export async function cleanupExpiredAuthRows() {
  const now = new Date();

  const [sessions, verifications] = await Promise.all([
    db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, now)).returning({ id: schema.sessions.id }),
    db.delete(schema.verifications).where(lt(schema.verifications.expiresAt, now)).returning({ id: schema.verifications.id }),
  ]);

  return { deletedSessions: sessions.length, deletedVerifications: verifications.length };
}
