import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTableCreator,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const pgTable = pgTableCreator((name) => name);
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    googleId: varchar("google_id", { length: 255 }).unique(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    password: varchar("password", { length: 255 }),
    image: varchar("image", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
      () => new Date()
    ),
  },
  (t) => ({
    emailIdx: index("user_email_idx").on(t.email),
    googleIdx: index("user_google_idx").on(t.googleId),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    userId: varchar("user_id", { length: 21 }).notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (t) => ({
    userIdx: index("session_user_idx").on(t.userId),
  })
);

export const emailVerificationCodes = pgTable(
  "email_verification_codes",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 21 }).unique().notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    code: varchar("code", { length: 8 }).notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (t) => ({
    userIdx: index("verification_code_user_idx").on(t.userId),
    emailIdx: index("verification_code_email_idx").on(t.email),
  })
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    userId: varchar("user_id", { length: 21 }).notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (t) => ({
    userIdx: index("password_token_user_idx").on(t.userId),
  })
);

export const stores = pgTable(
  "stores",
  {
    id: varchar("id", { length: 15 }).primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    username: varchar("username", { length: 255 }).unique(),
    name: varchar("name", { length: 255 }).notNull(),

    bio: text("bio").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
      () => new Date()
    ),
  },
  (t) => ({
    usernamex: index("store_username_idx").on(t.username),
    // userIdx: index("store_user_idx").on(t.userId),
    createdAtIdx: index("store_created_at_idx").on(t.createdAt),
  })
);

export const storeRelations = relations(stores, ({ one }) => ({
  user: one(users, {
    fields: [stores.userId],
    references: [users.id],
  }),
}));

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
