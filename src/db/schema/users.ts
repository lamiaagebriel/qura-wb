import { index, json } from "drizzle-orm/pg-core";

import { id, pgTable, timestamp, varchar } from "@/servers/db/utils";

export const users = pgTable(
  "users",
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

    name: varchar("name"),
    image: varchar("image"),
    phone: varchar("phone", { length: 20 }),
    preferences: json("preferences").default({}),
  },
  (t) => ({
    emailIdx: index("user_email_idx").on(t.email),
    googleIdx: index("user_google_idx").on(t.googleId),
  })
);

export type User = typeof users.$inferSelect;
