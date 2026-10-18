import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { accounts, businesses, history, placeAdmins, sessions, tickets, users } from "@/db/schema";
import type { Tx } from "@/lib/actions/run";
import { OPEN_STATUSES } from "@/lib/tickets/statuses";

/**
 * Turns a person into "Deleted account" (people are never deleted, so
 * what they posted keeps its place): their name, username, email, photo
 * and bio go (rule 7), they're signed out and can't sign in again, their
 * businesses lose their owner, they stop looking after places, their open
 * tickets are cancelled (rule 15), and their old details are wiped from
 * history (rule 14). Run inside an action (`runAction`).
 *
 * Refused by the database for the last active super admin (rule 16).
 */
export async function anonymizeUser(tx: Tx, userId: string) {
  const tag = `deleted-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
  await tx
    .update(users)
    .set({
      name: "Deleted account",
      username: tag,
      // Unique and never deliverable (`.invalid` is reserved).
      email: `${tag}@deleted.invalid`,
      emailVerified: false,
      image: null,
      bio: null,
      role: "member",
      status: "deleted",
    })
    .where(eq(users.id, userId));
  await tx.delete(sessions).where(eq(sessions.userId, userId));
  await tx.delete(accounts).where(eq(accounts.userId, userId));
  await tx.update(businesses).set({ ownerId: null }).where(eq(businesses.ownerId, userId));
  await tx.delete(placeAdmins).where(eq(placeAdmins.userId, userId));
  await tx
    .update(tickets)
    .set({ status: "cancelled" })
    .where(and(eq(tickets.createdById, userId), inArray(tickets.status, [...OPEN_STATUSES])));
  // Their user row's past values (name, username, bio…), including the
  // change just made: the record stays, its contents go.
  await tx
    .update(history)
    .set({ changes: null, row: null })
    .where(and(eq(history.tableName, "users"), eq(history.recordId, userId), sql`${history.entry} = 'change'`));
}
