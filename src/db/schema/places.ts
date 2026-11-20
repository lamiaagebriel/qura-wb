import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  index,
  jsonb,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import type { Localized } from "@/lib/localized";

import { id, timestamps } from "../helpers";

/**
 * What kind of place one is (city, markaz, village, neighborhood…). The
 * listed ones are offered when asking for a place; an "Other" kind from an
 * approved request is added listed.
 */
export const placeTypes = pgTable(
  "place_types",
  {
    ...id,
    ...timestamps,
    name: jsonb().$type<Localized>().notNull(),
    listed: boolean().notNull().default(true),
  },
  (t) => [
    check("place_types_name_check", sql`has_text(${t.name})`),
    // One kind per name, in each language (any case).
    uniqueIndex("place_types_name_en_idx").on(sql`lower(${t.name}->>'en')`),
    uniqueIndex("place_types_name_ar_idx").on(sql`lower(${t.name}->>'ar')`),
  ],
);

/**
 * Where things happen: a tree with no depth limit (Cairo → Maadi → Degla…).
 * Posts and branches point at `id`; `slug` only makes addresses (the
 * picker's cookie), so it can change. A place can't be inside itself (a
 * trigger checks moves).
 */
export const places = pgTable(
  "places",
  {
    ...id,
    ...timestamps,
    slug: varchar({ length: 80 }).notNull().unique(),
    parentId: uuid().references((): AnyPgColumn => places.id, { onDelete: "restrict" }),
    typeId: uuid()
      .notNull()
      .references(() => placeTypes.id, { onDelete: "restrict" }),
    name: jsonb().$type<Localized>().notNull(),
    /** Locates a map pin's nearest place; places asked for may have none. */
    lat: doublePrecision(),
    lng: doublePrecision(),
  },
  (t) => [
    index("places_parent_id_idx").on(t.parentId),
    check("places_name_check", sql`has_text(${t.name})`),
  ],
);

export type PlaceType = typeof placeTypes.$inferSelect;
export type PlaceRow = typeof places.$inferSelect;
