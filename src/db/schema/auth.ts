import {
  bigint,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { id, timestamps } from "../helpers";

/**
 * Better Auth's tables. `users` is also read by the app (roles, owners);
 * the rest are only used by Better Auth — app code never queries them.
 * `sessions` and `accounts` belong to a user (deleted with it);
 * `verifications` and `rate_limits` stand alone.
 */

export const USER_ROLES = ["super_admin", "business_owner"] as const;
export const userRole = pgEnum("user_role", USER_ROLES);

export const USER_STATUSES = ["active", "suspended"] as const;
export const userStatus = pgEnum("user_status", USER_STATUSES);

/**
 * The person who signs in — private account data (Better Auth's "user"
 * model). Has many `sessions`, `accounts` and owned `businesses`. Never
 * shown publicly — only businesses are.
 * `role` (admin?), `status` (suspended?), `username` and `bio` are ours,
 * declared as `additionalFields` in `lib/auth/auth.ts`.
 */
export const users = pgTable("users", {
  ...id,
  ...timestamps,
  name: varchar({ length: 255 }).notNull(),
  // `.unique()` creates the lookup index — don't add a second one.
  email: varchar({ length: 255 }).notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  // `text`: Google avatar URLs can exceed 255 chars.
  image: text(),
  role: userRole().notNull().default("business_owner"),
  status: userStatus().notNull().default("active"),
  username: varchar({ length: 50 }).notNull().unique(),
  bio: text(),
});

export type User = typeof users.$inferSelect;
export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];

/**
 * One row per signed-in device/browser; the session cookie points to it.
 * Signing out (or expiry) removes the row.
 */
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

/**
 * *How* a user signs in — one row per method (`providerId` "google" with
 * Google's user id and tokens). Separate from `users` so one person can
 * have several sign-in methods without being duplicated. `password` unused.
 */
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

/**
 * Short-lived values Better Auth needs mid-flow, e.g. the OAuth "state"
 * proving Google's callback matches the sign-in you started. Expire fast.
 */
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
 * Request counters that block abuse (e.g. too many sign-in attempts). In
 * the DB, not memory, so limits hold across every serverless instance.
 * `lastRequest` is a ms timestamp.
 */
export const rateLimits = pgTable("rate_limits", {
  ...id,
  key: text().notNull().unique(),
  count: integer().notNull(),
  lastRequest: bigint({ mode: "number" }).notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
