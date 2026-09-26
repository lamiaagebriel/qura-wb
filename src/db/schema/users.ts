import { boolean, pgEnum, pgTable, text, varchar } from "drizzle-orm/pg-core";

import { id, timestamps } from "../helpers";

export const USER_ROLES = ["super_admin", "business_owner"] as const;
export const userRole = pgEnum("user_role", USER_ROLES);

export const USER_STATUSES = ["active", "suspended"] as const;
export const userStatus = pgEnum("user_status", USER_STATUSES);

/**
 * Better Auth's "user" model (the signed-in person). What posts and gets
 * followed is a `profiles` row, not this. `role`, `status`, `username` and
 * `bio` are ours, declared as `additionalFields` in `lib/auth/auth.ts`.
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
