import { boolean, pgEnum, pgTable, text, varchar } from "drizzle-orm/pg-core";

import { id, timestamps } from "../helpers";

export const USER_ROLES = ["super_admin", "business_owner"] as const;
export const userRole = pgEnum("user_role", USER_ROLES);

export const USER_STATUSES = ["active", "suspended"] as const;
export const userStatus = pgEnum("user_status", USER_STATUSES);

/**
 * The person who signs in — private account data (Better Auth's "user"
 * model). Has many `sessions` and `accounts`, and one personal `profiles`
 * row. What posts and gets followed is the profile, not this: one person
 * can act as several identities (their own + businesses they manage).
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
