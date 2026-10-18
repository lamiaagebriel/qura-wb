import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import { users } from "./auth";

/** One column's change: what it was, what it became. */
export type HistoryChange = [before: unknown, after: unknown];

export const HISTORY_ENTRIES = ["action", "change"] as const;
export const HISTORY_SOURCES = ["app", "dashboard", "seed", "sql", "system"] as const;
export const HISTORY_OPS = ["insert", "update", "delete"] as const;

const list = (values: readonly string[]) => sql.raw(values.map((v) => `'${v}'`).join(", "));

/**
 * Everything that happened, in order, never edited:
 * - an `action` entry: someone did something through the app (`runAction`:
 *   `action`, its `input`, the reason in `note`);
 * - a `change` entry: a row a write inserted, updated or deleted, written by
 *   the `history_record_change()` trigger on every table, with only the
 *   columns that changed (`changes`: column → [before, after]) and, on a
 *   delete, the whole row. It points at the action it was part of
 *   (`actionId`); none = a write outside the app (`source` "sql").
 * Never holds emails or sign-in secrets (the trigger leaves them out);
 * anonymizing a person wipes their personal fields here too.
 */
export const history = pgTable(
  "history",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    at: timestamp({ withTimezone: true }).defaultNow().notNull(),
    entry: varchar({ length: 10 }).notNull(),
    actionId: bigint({ mode: "number" }).references((): AnyPgColumn => history.id, {
      onDelete: "set null",
    }),
    actorId: uuid().references(() => users.id, { onDelete: "set null" }),
    source: varchar({ length: 12 }).notNull(),
    // An action entry.
    action: varchar({ length: 60 }),
    input: jsonb().$type<Record<string, unknown>>(),
    note: text(),
    // A change entry.
    tableName: varchar({ length: 63 }),
    recordId: varchar({ length: 120 }),
    op: varchar({ length: 6 }),
    changes: jsonb().$type<Record<string, HistoryChange>>(),
    row: jsonb().$type<Record<string, unknown>>(),
  },
  (t) => [
    check("history_entry_check", sql`${t.entry} in (${list(HISTORY_ENTRIES)})`),
    check("history_source_check", sql`${t.source} in (${list(HISTORY_SOURCES)})`),
    check("history_op_check", sql`${t.op} is null or ${t.op} in (${list(HISTORY_OPS)})`),
    // A record's history, newest first.
    index("history_record_idx").on(t.tableName, t.recordId, t.id),
    // A person's activity, newest first.
    index("history_actor_idx").on(t.actorId, t.id),
    // An action's changes.
    index("history_action_id_idx").on(t.actionId),
    index("history_action_idx").on(t.action, t.id),
  ],
);

export type HistoryRow = typeof history.$inferSelect;
