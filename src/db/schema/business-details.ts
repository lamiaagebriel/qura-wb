import { sql } from "drizzle-orm";
import {
  check,
  doublePrecision,
  index,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  time,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import type { Localized } from "@/lib/localized";
import { LINK_PLATFORMS, type LinkPlatform } from "@/lib/business";

import { id } from "../helpers";
import { businesses } from "./businesses";

const business = () =>
  uuid()
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" });

/**
 * A business's branches — at least one (checked by the save action). Saving
 * replaces the business's rows, in `position` order.
 */
export const businessLocations = pgTable(
  "business_locations",
  {
    ...id,
    businessId: business(),
    position: smallint().notNull(),
    /** The address as the owner wrote it, per language. */
    address: jsonb().$type<Localized>().notNull(),
    lat: doublePrecision().notNull(),
    lng: doublePrecision().notNull(),
  },
  (t) => [
    index("business_locations_business_id_idx").on(t.businessId),
    check("business_locations_lat_check", sql`${t.lat} between -90 and 90`),
    check("business_locations_lng_check", sql`${t.lng} between -180 and 180`),
  ],
);

// The same list the form validates against (`lib/business.ts`).
export const linkPlatform = pgEnum(
  "link_platform",
  LINK_PLATFORMS as [LinkPlatform, ...LinkPlatform[]],
);

/**
 * WhatsApp, phone numbers, website and social accounts, in the order shown.
 * At least one WhatsApp (checked by the save action). `url` holds the number
 * for WhatsApp / phone.
 */
export const businessLinks = pgTable(
  "business_links",
  {
    ...id,
    businessId: business(),
    position: smallint().notNull(),
    platform: linkPlatform().notNull(),
    url: varchar({ length: 300 }).notNull(),
  },
  (t) => [index("business_links_business_id_idx").on(t.businessId)],
);

/**
 * Opening hours, one row per open day; no row = closed that day.
 * `day`: 0 = Sunday (as `Date#getDay()`). Times are in the business's
 * `timeZone`; closing at midnight is stored as 24:00, so `opens < closes`
 * always holds (00:00–24:00 = open all day).
 */
export const businessHours = pgTable(
  "business_hours",
  {
    businessId: business(),
    day: smallint().notNull(),
    opens: time().notNull(),
    closes: time().notNull(),
  },
  (t) => [
    uniqueIndex("business_hours_business_id_day_idx").on(t.businessId, t.day),
    check("business_hours_day_check", sql`${t.day} between 0 and 6`),
    check("business_hours_order_check", sql`${t.opens} < ${t.closes}`),
  ],
);
