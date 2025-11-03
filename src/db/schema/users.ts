import {
  defaultFields,
  pgTable,
  references,
  timestamp,
  varchar,
} from "@/db/utils";
import { boolean, index, json, pgEnum } from "drizzle-orm/pg-core";

import { Validation } from "@/lib/validations";

export const userRole = pgEnum("user_role", ["admin", "user", "merchant"]);

// === Tables ===
export const users = pgTable(
  "qurawb__users",
  {
    ...defaultFields,
    // Authentication fields
    email: varchar("email").unique().notNull(),
    googleId: varchar("google_id").unique(),
    password: varchar("password"),

    // Email verification
    emailVerified: boolean("email_verified").default(false).notNull(),
    emailVerificationDetails: json("email_verification_details").$type<
      Validation["email-verification-schema"]
    >(),

    // Password reset
    resetPasswordDetails: json("reset_password_details").$type<
      Validation["password-reset-schema"]
    >(),

    // Profile fields
    role: userRole("role").default("user").notNull(),
    name: varchar("name"),
    image: varchar("image"),
    phone: varchar("phone", { length: 20 }),
    address: json("address").$type<Validation["address-schema"][]>(),
    preferences: json("preferences").default({}),
  },
  (t) => ({
    emailIdx: index("user_email_idx").on(t.email),
    googleIdx: index("user_google_idx").on(t.googleId),
  })
);

export const sessions = pgTable(
  "qurawb__sessions",
  {
    id: varchar("id").primaryKey(),
    userId: references("user_id", { length: 21 }, users?.id, {
      onDelete: "cascade",
    }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),

    // userAgent: text("user_agent"),
    // ipAddress: varchar("ip_address", { length: 45 }),
  },
  (t) => ({
    userIdx: index("session_user_idx").on(t.userId),
    expiresIdx: index("session_expires_idx").on(t.expiresAt),
  })
);

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
