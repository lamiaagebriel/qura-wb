import {
  createdAt,
  id,
  pgTable,
  references,
  timestamp,
  updatedAt,
  varchar,
} from "@/db/helpers";
import { index } from "drizzle-orm/pg-core";

import { users } from "./users";

/**
 * Better Auth's "session" model. Unlike the old hand-rolled table, the raw
 * session token is stored as-is in `token` (Better Auth hashes/signs the
 * cookie itself) rather than us hashing it into `id` — `id` is just a
 * regular generated primary key here.
 */
export const sessions = pgTable(
  "sessions",
  {
    ...id,
    ...createdAt,
    ...updatedAt,

    token: varchar("token").notNull().unique(),
    userId: references({
      k: "user_id",
      ref: users.id,
      actions: { onDelete: "cascade" },
    }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: varchar("ip_address"),
    userAgent: varchar("user_agent", { length: 512 }),
  },
  // Postgres doesn't auto-index foreign key columns (unlike some other
  // engines) — without this, anything that looks up "all sessions for
  // this user" (Better Auth's own revoke-on-password-reset, listing
  // sessions, our cleanup job in `lib/db/cleanup.ts`) is a sequential scan
  // over the whole table as it grows.
  (t) => [
    index("session__user_id__idx").on(t.userId),
    index("session__expires_at__idx").on(t.expiresAt),
  ],
);

export type Session = typeof sessions.$inferSelect;
