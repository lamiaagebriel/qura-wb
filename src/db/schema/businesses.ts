import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import type { OpeningHours } from "@/lib/business";
import { BUSINESS_STATUSES } from "@/lib/business-status";
import type { Localized } from "@/lib/localized";
import type { SocialLink } from "@/lib/socials";

import { id, timestamps } from "../helpers";
import { users } from "./auth";
import { places } from "./places";

/**
 * A restaurant, shop… — what gets followed, reviewed and searched, shown at
 * `/bs/[username]`.
 * - `createdById`: whoever added it; `ownerId`: its owner — empty when it
 *   was added for someone else (or its owner's account was deleted).
 * - `status`: see `lib/business-status.ts` (who may change it). When it
 *   changed, and who changed it, is in `history`.
 * - `links` and `hours` are always read and saved with the business, so
 *   they live on its row.
 */
export const businessStatus = pgEnum("business_status", BUSINESS_STATUSES);

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
    name: jsonb().$type<Localized>().notNull(),
    bio: jsonb().$type<Localized>().notNull().default({}),
    /** A slug from the category tree (`lib/categories.ts`), any level. */
    category: varchar({ length: 50 }).notNull(),
    /** IANA zone the opening hours are in. */
    timeZone: varchar({ length: 64 }).notNull(),
    image: text(),
    /** Set by admins only. */
    verified: boolean().notNull().default(false),
    /** New ones wait for an admin; only `active` ones are listed. */
    status: businessStatus().notNull().default("pending"),
    /** WhatsApp first, then phone, website and social accounts, in order. */
    links: jsonb().$type<SocialLink[]>().notNull().default([]),
    /**
     * The weekly opening hours: 7 entries, Sunday first (`Date#getDay()`),
     * `null` = closed that day; times in `timeZone`, closing at midnight is
     * "24:00".
     */
    hours: jsonb().$type<(OpeningHours | null)[]>().notNull().default([]),
  },
  (t) => [
    index("businesses_owner_id_idx").on(t.ownerId),
    index("businesses_created_by_id_idx").on(t.createdById),
    index("businesses_category_idx").on(t.category),
    index("businesses_status_idx").on(t.status),
    check("businesses_name_check", sql`has_text(${t.name})`),
  ],
);

export type Business = typeof businesses.$inferSelect;

/**
 * A business's branches — at least one (checked by the save action). Each
 * is in a place: the business shows in that place's feeds and every place
 * above it. Saving replaces the business's rows, in `position` order.
 */
export const businessLocations = pgTable(
  "business_locations",
  {
    ...id,
    businessId: uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    placeId: uuid()
      .notNull()
      .references(() => places.id, { onDelete: "restrict" }),
    position: smallint().notNull(),
    /** The address as the owner wrote it. */
    address: jsonb().$type<Localized>().notNull(),
    lat: doublePrecision().notNull(),
    lng: doublePrecision().notNull(),
  },
  (t) => [
    index("business_locations_business_id_idx").on(t.businessId),
    index("business_locations_place_id_idx").on(t.placeId, t.businessId),
    check("business_locations_lat_check", sql`${t.lat} between -90 and 90`),
    check("business_locations_lng_check", sql`${t.lng} between -180 and 180`),
    check("business_locations_address_check", sql`has_text(${t.address})`),
  ],
);

/** A person following a business. */
export const businessFollows = pgTable(
  "business_follows",
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.businessId] }),
    // Follower counts.
    index("business_follows_business_id_idx").on(t.businessId),
  ],
);

export const REVIEW_STATUSES = ["visible", "hidden"] as const;
export const reviewStatus = pgEnum("review_status", REVIEW_STATUSES);

/**
 * A person's review of a business: 1–5 stars and optional text. One per
 * person per business — writing again edits it. Not of a business they own
 * or added (the action checks). Hidden ones (a report) don't count.
 * The author can't be hard-deleted (accounts are anonymized instead).
 */
export const businessReviews = pgTable(
  "business_reviews",
  {
    ...id,
    ...timestamps,
    businessId: uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    authorId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    rating: smallint().notNull(),
    text: varchar({ length: 1000 }).notNull().default(""),
    status: reviewStatus().notNull().default("visible"),
  },
  (t) => [
    uniqueIndex("business_reviews_business_author_idx").on(t.businessId, t.authorId),
    // Newest first on a business's page.
    index("business_reviews_business_created_idx").on(t.businessId, t.createdAt),
    index("business_reviews_author_id_idx").on(t.authorId),
    check("business_reviews_rating_check", sql`${t.rating} between 1 and 5`),
  ],
);

export type BusinessReview = typeof businessReviews.$inferSelect;
