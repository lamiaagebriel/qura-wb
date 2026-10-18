/**
 * Admin tasks from a terminal: `pnpm admin <command> <who>`. Each one is a
 * recorded action (`history`, source "system"), like the dashboard's.
 *
 *   pnpm admin verify @nileview          the blue badge on a business
 *   pnpm admin unverify @nileview
 *   pnpm admin approve @nileview         a pending business goes live
 *   pnpm admin suspend @nileview         hidden from everyone but its owner
 *   pnpm admin restore @nileview         live again (after suspend / close)
 *   pnpm admin close @nileview           closed for good (its page says so)
 *   pnpm admin suspend-user a@b.com      signed out, can't sign in
 *   pnpm admin restore-user a@b.com
 *   pnpm admin make-admin a@b.com        role super_admin
 *   pnpm admin anonymize-user a@b.com    "Deleted account", for good
 *
 * Runs against DATABASE_URL (in production: the production database).
 * Category counts refresh within an hour, or at the next business save.
 */
import { eq } from "drizzle-orm";

import { runAction, type Tx } from "@/lib/actions/run";
import type { BusinessStatus } from "@/lib/business-status";
import { anonymizeUser } from "@/lib/users/anonymize";

import { db } from "./index";
import { businesses, sessions, users } from "./schema";

/** Runs `work` as a recorded action by "the system". */
const asSystem = (action: string, input: Record<string, unknown>, work: (tx: Tx) => Promise<void>) =>
  runAction({ action, actorId: null, source: "system", input }, work);

async function setBusiness(action: string, handle: string, values: Partial<typeof businesses.$inferInsert>) {
  const username = handle.replace(/^@/, "").toLowerCase();
  await asSystem(action, { username }, async (tx) => {
    const [row] = await tx
      .update(businesses)
      .set(values)
      .where(eq(businesses.username, username))
      .returning({ username: businesses.username });
    if (!row) throw new Error(`No business @${username}.`);
  });
  console.log(`@${username}:`, values);
}

// Same effect as the dashboard, minus answering open close / reopen tickets.
const setStatus = (handle: string, status: BusinessStatus) => setBusiness(`businesses.status:${status}`, handle, { status });

/** The user with this email, inside the action (or a clear error). */
async function userId(tx: Tx, email: string) {
  const [row] = await tx.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (!row) throw new Error(`No user ${email}.`);
  return row.id;
}

async function setUser(action: string, email: string, values: Partial<typeof users.$inferInsert>, after?: (tx: Tx, id: string) => Promise<unknown>) {
  await asSystem(action, {}, async (tx) => {
    const id = await userId(tx, email);
    await tx.update(users).set(values).where(eq(users.id, id));
    await after?.(tx, id);
  });
  console.log(`${email}:`, values);
}

const COMMANDS = {
  verify: (handle: string) => setBusiness("businesses.verify", handle, { verified: true }),
  unverify: (handle: string) => setBusiness("businesses.unverify", handle, { verified: false }),
  approve: (handle: string) => setStatus(handle, "active"),
  suspend: (handle: string) => setStatus(handle, "suspended"),
  restore: (handle: string) => setStatus(handle, "active"),
  close: (handle: string) => setStatus(handle, "closed"),
  // Signed out everywhere now, not when their sessions expire.
  "suspend-user": (email: string) =>
    setUser("users.suspend", email, { status: "suspended" }, (tx, id) => tx.delete(sessions).where(eq(sessions.userId, id))),
  "restore-user": (email: string) => setUser("users.restore", email, { status: "active" }),
  "make-admin": (email: string) => setUser("users.make-admin", email, { role: "super_admin" }),
  "anonymize-user": async (email: string) => {
    await asSystem("users.anonymize", {}, async (tx) => anonymizeUser(tx, await userId(tx, email)));
    console.log(`${email}: anonymized`);
  },
};

async function main() {
  const [command, who] = process.argv.slice(2);
  if (!(command in COMMANDS) || !who) {
    console.log(`Usage: pnpm admin <${Object.keys(COMMANDS).join(" | ")}> <@business | email>`);
    process.exitCode = 1;
    return;
  }
  await COMMANDS[command as keyof typeof COMMANDS](who);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
