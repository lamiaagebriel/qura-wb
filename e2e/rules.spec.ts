import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { db } from "./auth";
import { expect, test } from "./fixtures";

// The data rules that hold the system together, checked on the code and on
// the database itself (no browser). See AGENTS.md → "DB".

/** Every .ts / .tsx file under `dir`. */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

/**
 * Where writing straight to `db` (not through `runAction`) is allowed, and
 * why. Everything else writes in an action, so history records it.
 */
const DIRECT_WRITES: Record<string, string> = {
  // Votes and saves aren't history (rule 8).
  "src/components/posts/post-actions.ts": "votes and saves",
  // Counters, not records.
  "src/lib/rate-limit.ts": "rate limits",
  // The action itself: its history entry and the writes it wraps.
  "src/lib/actions/run.ts": "runAction",
};

test.describe("data rules", () => {
  test("rule 9: code writes only through runAction", () => {
    const offenders = sources("src").flatMap((file) => {
      const path = relative(".", file).replace(/\\/g, "/");
      if (path in DIRECT_WRITES) return [];
      const code = readFileSync(file, "utf8");
      // `db.insert(` / `db\n  .update(` / `db.delete(` / `db.execute(` (raw SQL).
      const writes = code.match(/\bdb\s*\.\s*(insert|update|delete|execute)\s*\(/g) ?? [];
      return writes.length ? [`${path}: ${writes.join(", ").replace(/\s+/g, "")}`] : [];
    });
    expect(offenders, "write in a runAction (or add the file to DIRECT_WRITES, with why)").toEqual([]);
  });

  test("rule 10: every table records its changes in history", async () => {
    const missing = await db()<{ table: string }[]>`
      select c.relname as table from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
        and c.relname not in (
          'history', 'sessions', 'accounts', 'verifications', 'rate_limits',
          'post_votes', 'post_saves', '__drizzle_migrations')
        and not exists (
          select 1 from pg_trigger t where t.tgrelid = c.oid and t.tgname = 'history')`;
    expect(missing.map((row) => row.table), "attach it: select history_attach('<table>')").toEqual([]);
  });

  test("rule 1: people can't be deleted, only anonymized", async () => {
    const sql = db();
    await expect(
      sql.begin(async (tx) => {
        await tx`delete from users where id = (select id from users limit 1)`;
        throw new Error("deleted");
      }),
    ).rejects.toThrow(/anonymized, never deleted/);
  });

  test("rule 3: a place can't be inside itself", async () => {
    const sql = db();
    await expect(
      sql.begin(async (tx) => {
        // Aswan inside Edfu, which is inside Aswan.
        await tx`update places set parent_id = (select id from places where slug = 'edfu') where slug = 'aswan'`;
        throw new Error("moved");
      }),
    ).rejects.toThrow(/inside itself/);
  });

  test("rule 18: a name needs at least one language", async () => {
    const sql = db();
    await expect(
      sql.begin(async (tx) => {
        await tx`update places set name = ${sql.json({ en: "", ar: "" })} where slug = 'aswan'`;
        throw new Error("saved");
      }),
    ).rejects.toThrow(/check/i);
  });
});
