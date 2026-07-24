import {
  createdAt,
  id,
  pgTable,
  timestamp,
  updatedAt,
  varchar,
} from "@/db/helpers";
import { boolean, pgEnum } from "drizzle-orm/pg-core";

export const USER_ROLES = ["super_admin", "bussiness_owner"] as const;
export const userRoleEnum = pgEnum("user__role", USER_ROLES);

export const USER_STATUSES = ["pending", "active", "suspended"] as const;
export const userStatusEnum = pgEnum("user__status", USER_STATUSES);

/**
 * This is Better Auth's "user" model — see `lib/auth/auth.ts`'s
 * `database.schema.user` mapping. `role` and `status` are ours, wired in via
 * `user.additionalFields` in that same config; Better Auth only ever reads
 * them, never writes them except through the hooks we define there.
 *
 * NOTE: no `password` column here — Better Auth stores password hashes on
 * `accounts` (one row per sign-in method, `providerId: "credential"` for
 * email/password), not on the user itself. See `accounts.ts`.
 */
export const users = pgTable("users", {
  ...id,
  ...createdAt,
  ...updatedAt,

  name: varchar("name").notNull(),
  // `.unique()` already creates a unique B-tree index covering this column
  // — every lookup by email (sign-in, sign-up dupe-check, forgot-password)
  // uses it. Don't add a second explicit index on the same column: it'd be
  // pure waste, extra disk space and extra work on every insert/update for
  // an index that duplicates this one exactly.
  email: varchar("email").unique().notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: varchar("image"),

  role: userRoleEnum("role").notNull().default("bussiness_owner"),
  status: userStatusEnum("status").notNull().default("pending"),

  // Cooldown bookkeeping for the two "resend the link" actions — see
  // `lib/auth/actions/verify-email.ts` and `forgot-password.ts`. Better
  // Auth's own verification store has no notion of a per-user send
  // cooldown, so we track it here instead of reinventing its schema.
  lastVerificationEmailSentAt: timestamp("last_verification_email_sent_at"),
  lastPasswordResetEmailSentAt: timestamp("last_password_reset_email_sent_at"),
});

export type User = typeof users.$inferSelect;
export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
