/**
 * Admin tasks until there's an admin screen: `pnpm admin <command> <who>`.
 *
 *   pnpm admin verify @nileview         the blue badge on a business
 *   pnpm admin unverify @nileview
 *   pnpm admin suspend @nileview        hidden from everyone but its owner
 *   pnpm admin restore @nileview
 *   pnpm admin suspend-user a@b.com     signed out, can't sign in
 *   pnpm admin restore-user a@b.com
 *   pnpm admin make-admin a@b.com       role super_admin
 *
 * Runs against DATABASE_URL (in production: the production database).
 * Category counts refresh within an hour, or at the next business save.
 */
import { eq } from "drizzle-orm";

import { db } from "./index";
import { businesses, sessions, users } from "./schema";

const COMMANDS = {
  verify: (handle: string) => setBusiness(handle, { verified: true }),
  unverify: (handle: string) => setBusiness(handle, { verified: false }),
  suspend: (handle: string) => setBusiness(handle, { suspendedAt: new Date() }),
  restore: (handle: string) => setBusiness(handle, { suspendedAt: null }),
  "suspend-user": async (email: string) => {
    const id = await setUser(email, { status: "suspended" });
    // Signed out everywhere now, not when their sessions expire.
    await db.delete(sessions).where(eq(sessions.userId, id));
  },
  "restore-user": (email: string) => setUser(email, { status: "active" }),
  "make-admin": (email: string) => setUser(email, { role: "super_admin" }),
};

async function setBusiness(
  handle: string,
  values: Partial<typeof businesses.$inferInsert>,
) {
  const username = handle.replace(/^@/, "").toLowerCase();
  const [row] = await db
    .update(businesses)
    .set(values)
    .where(eq(businesses.username, username))
    .returning({ username: businesses.username });
  if (!row) throw new Error(`No business @${username}.`);
  console.log(`@${row.username}:`, values);
}

async function setUser(
  email: string,
  values: Partial<typeof users.$inferInsert>,
) {
  const [row] = await db
    .update(users)
    .set(values)
    .where(eq(users.email, email.toLowerCase()))
    .returning({ id: users.id, email: users.email });
  if (!row) throw new Error(`No user ${email}.`);
  console.log(`${row.email}:`, values);
  return row.id;
}

async function main() {
  const [command, who] = process.argv.slice(2);
  if (!(command in COMMANDS) || !who) {
    console.log(
      `Usage: pnpm admin <${Object.keys(COMMANDS).join(" | ")}> <@business | email>`,
    );
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
