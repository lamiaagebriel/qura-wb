import { timestamp, uuid } from "drizzle-orm/pg-core";

// Shared columns — spread into a table: `pgTable("x", { ...id, ...timestamps, ... })`.
// Column names come from the keys (snake_case via `casing`), so none are repeated here.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Every table's primary key: a random uuid. */
export const id = {
  id: uuid().primaryKey().defaultRandom(),
};

/**
 * Every primary key is a uuid. Check ids that come from outside (route
 * params, server action args) before querying — otherwise Postgres throws
 * "invalid input syntax for type uuid" and it surfaces as a 500 instead of
 * a plain "not found".
 */
export function isValidId(value: string): boolean {
  return UUID_RE.test(value);
}

/** Timezone-aware; `updatedAt` refreshes on every Drizzle update. */
export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};
