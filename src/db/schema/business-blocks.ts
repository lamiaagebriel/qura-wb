import { createdAt, id, pgTable, references, updatedAt } from "@/db/helpers";
import { jsonb, pgEnum } from "drizzle-orm/pg-core";

import { users } from "./users";

// The 18 main categories from the product's category tree (see
// `lib/categories.ts` for labels/icons/subcategories — subcategories
// aren't wired up anywhere yet, this list is only the top level, which
// is also what's actually persisted). Add a slug here (and to
// `CATEGORY_META` in `lib/categories.ts`) to support a new one.
export const BUSINESS_CATEGORIES = [
  "food-drinks",
  "health",
  "beauty",
  "creative",
  "shopping",
  "home-services",
  "automotive",
  "education",
  "tourism",
  "professional-services",
  "real-estate",
  "jobs",
  "marketplace",
  "community",
  "events",
  "government",
  "emergency",
  "lifestyle",
] as const;
export const businessCategoryEnum = pgEnum(
  "business_block__category",
  BUSINESS_CATEGORIES,
);
export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

/**
 * Category-specific structured data for a business profile. One row per
 * business (`businessId` unique) — a business has exactly one category,
 * so this is a 1:1 extension of the business row, not a join table.
 *
 * `data` is `jsonb`, not a column per field: only `food-drinks` and
 * `health` have bespoke fields today (`lib/validations/business-block.ts`)
 * — every other category currently gets the generic free-text schema.
 * The tradeoff is the usual one for this shape — no DB-level constraint
 * on what's inside `data`, only whatever the zod schema for that
 * category enforced at write time.
 */
export const businessBlocks = pgTable("business_blocks", {
  ...id,
  ...createdAt,
  ...updatedAt,

  businessId: references({
    k: "business_id",
    ref: users.id,
    actions: { onDelete: "cascade" },
  })
    .notNull()
    .unique(),

  category: businessCategoryEnum("category").notNull(),
  data: jsonb("data").notNull(),
});

export type BusinessBlock = typeof businessBlocks.$inferSelect;
