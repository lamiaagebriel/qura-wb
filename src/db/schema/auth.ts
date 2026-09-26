import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { id, timestamps } from "../helpers";
import { users } from "./users";

// Better Auth's session, account and verification models.

export const sessions = pgTable(
  "sessions",
  {
    ...id,
    ...timestamps,
    token: varchar({ length: 255 }).notNull().unique(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: varchar({ length: 255 }),
    userAgent: text(),
  },
  (t) => [
    index("sessions_user_id_idx").on(t.userId),
    index("sessions_expires_at_idx").on(t.expiresAt),
  ],
);

/** One row per sign-in method. `providerId` is "google"; `password` stays unused. */
export const accounts = pgTable(
  "accounts",
  {
    ...id,
    ...timestamps,
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: varchar({ length: 255 }).notNull(),
    providerId: varchar({ length: 255 }).notNull(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
  },
  (t) => [
    uniqueIndex("accounts_provider_id_account_id_idx").on(
      t.providerId,
      t.accountId,
    ),
    index("accounts_user_id_idx").on(t.userId),
  ],
);

/** Short-lived values Better Auth needs (e.g. OAuth state). */
export const verifications = pgTable(
  "verifications",
  {
    ...id,
    ...timestamps,
    identifier: varchar({ length: 255 }).notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

/**
 * Better Auth's rate-limit counters. Kept in the DB (not memory) so limits
 * hold across serverless instances. `lastRequest` is a ms timestamp.
 */
export const rateLimits = pgTable("rate_limits", {
  ...id,
  key: text().notNull().unique(),
  count: integer().notNull(),
  lastRequest: bigint({ mode: "number" }).notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
