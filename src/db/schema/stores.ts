import { id, pgTable, references, timestamp, varchar } from "@/db/utils";
import { index, pgEnum, text } from "drizzle-orm/pg-core";

import { users } from "./users";

export const storeStatus = pgEnum("store_status", ["draft", "live"]);

export const stores = pgTable(
  "qurawb__stores",
  {
    id: id("id", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$defaultFn(() => new Date())
      .notNull(),
    ownerId: references("owner_id", { length: 21 }, users.id, {
      onDelete: "cascade",
    }),

    username: varchar("username").notNull().unique(),
    name: varchar("name").notNull(),
    logo: varchar("logo"),
    bio: text("bio"),
    status: storeStatus("status").default("draft").notNull(),
  },
  (t) => ({
    usernameIdx: index("store_username_idx").on(t.username),
    ownerIdx: index("store_owner_idx").on(t.ownerId),
    createdAtIdx: index("store_created_at_idx").on(t.createdAt),
  })
);

export type Store = typeof stores.$inferSelect;
