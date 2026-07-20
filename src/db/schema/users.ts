import {
  createdAt,
  id,
  pgTable,
  references,
  timestamp,
  updatedAt,
  varchar,
} from "@/db/helpers";
import { relations } from "drizzle-orm";
import { index, pgEnum } from "drizzle-orm/pg-core";

export const USER_ROLES = ["super_admin", "bussiness_owner"] as const;
export const userRoleEnum = pgEnum("user__role", USER_ROLES);

export const USER_STATUSES = ["pending", "active", "suspended"] as const;
export const userStatusEnum = pgEnum("user__status", USER_STATUSES);

export const users = pgTable(
  "users",
  {
    ...id,
    ...createdAt,
    ...updatedAt,

    email: varchar("email").unique().notNull(),
    password: varchar("password"), // NOTE: password or googleId, one of them must exists
    googleId: varchar("google_id"),

    role: userRoleEnum("role").notNull(),
    status: userStatusEnum("status").notNull().default("active"),

    name: varchar("name").notNull(),
    picture: varchar("picture"),
  },
  (t) => [
    index("user___email__idx").on(t.email),
    index("user___google_id__idx").on(t.googleId),
  ],
);

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().notNull(), // this is how it is in lucia
  userId: references({
    k: "user_id",
    ref: users.id,
    actions: { onDelete: "cascade" },
  }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
export type Session = typeof sessions.$inferSelect;
