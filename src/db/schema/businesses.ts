import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import type { Localized } from "@/lib/localized";

import { id, timestamps } from "../helpers";
import { users } from "./auth";

/**
 * A restaurant, shop… — the only public identity in the app: what gets
 * followed, reviewed and searched, shown at `/bs/[username]`. Users are
 * private and never shown. Locations, links and hours have their own tables.
 * - `createdById`: whoever added it; can edit it.
 * - `ownerId`: the business's owner — empty when it was added for someone
 *   else, until they claim it. Organizations can come later on top.
 */
export const businesses = pgTable(
  "businesses",
  {
    ...id,
    ...timestamps,
    ownerId: uuid().references(() => users.id, { onDelete: "set null" }),
    createdById: uuid().references(() => users.id, { onDelete: "set null" }),
    // `.unique()` creates the lookup index — don't add a second one.
    // Its own namespace, separate from `users.username`.
    username: varchar({ length: 50 }).notNull().unique(),
    /** Written by the owner: English required, Arabic / French optional. */
    name: jsonb().$type<Localized>().notNull(),
    bio: jsonb().$type<Localized>().notNull().default({ en: "" }),
    /** A slug from the category tree (`lib/categories.ts`), any level. */
    category: varchar({ length: 50 }).notNull(),
    /** IANA zone the opening hours are in. */
    timeZone: varchar({ length: 64 }).notNull(),
    image: text(),
    /** Set by admins only. */
    verified: boolean().notNull().default(false),
    /** Set by admins: hidden from everyone but its owner and creator. */
    suspendedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index("businesses_owner_id_idx").on(t.ownerId),
    index("businesses_created_by_id_idx").on(t.createdById),
    index("businesses_category_idx").on(t.category),
  ],
);

export type Business = typeof businesses.$inferSelect;
