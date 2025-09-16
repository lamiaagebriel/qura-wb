import { id, pgTable, references, timestamp, varchar } from "@/db/utils";
import { relations } from "drizzle-orm";
import { boolean, index, json, pgEnum } from "drizzle-orm/pg-core";

import { Validation } from "@/lib/validations";

export const userRole = pgEnum("user_role", ["ADMIN", "USER", "MERCHANT"]);

// === Tables ===
export const users = pgTable(
  "qurawb__users",
  {
    id: id("id", { length: 21 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$defaultFn(() => new Date())
      .notNull(),

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
    resetPasswordDetails:
      json("reset_details").$type<Validation["password-reset-schema"]>(),

    // Profile fields
    role: userRole("role").default("USER").notNull(),
    name: varchar("name"),
    image: varchar("image"),
    phone: varchar("phone", { length: 20 }),
    address: json("address").$type<Validation["address-schema"]>(),
    preferences: json("preferences").default({}),
  },
  (t) => ({
    emailIdx: index("user_email_idx").on(t.email),
    googleIdx: index("user_google_idx").on(t.googleId),
    roleIdx: index("user_role_idx").on(t.role),
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

// === Relations ===
export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;

export type UserRelations = typeof userRelations;
export type SessionRelations = typeof sessionRelations;
