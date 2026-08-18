import * as z from "zod";

import type { Dict } from "@/lib/i18n/config";
import { createLocationSchema, createPhonesSchema } from "@/lib/location";
import { createSocialLinksSchema } from "@/lib/social";
import { createWorkingHoursSchema } from "@/lib/working-hours";

type Translate = (key: keyof Dict) => string;

const URL_RE = /^https?:\/\/.+/i;

export const RESTAURANT_PRICE_RANGES = ["$", "$$", "$$$", "$$$$"] as const;
export type RestaurantPriceRange = (typeof RESTAURANT_PRICE_RANGES)[number];

// Only these two categories have bespoke fields today — everything else
// (the other 16 of the 18 top-level categories) falls back to
// `createGenericBlockSchema` below. `category: z.literal(...)` isn't just
// documentation — it's what lets `upsertBusinessBlockAction` pick the
// right schema for whatever payload actually arrived, and what makes the
// union a real discriminated union on the client. `location`/`phones`
// (see `lib/location.ts`) are shared across every category, bespoke or
// not — added once here, and once in the generic schema below, not
// per-category.
export function createFoodDrinksBlockSchema(t: Translate) {
  return z.object({
    category: z.literal("food-drinks"),
    cuisine: z
      .string()
      .min(1, t("Please enter a cuisine type."))
      .max(60, t("Must be at most 60 characters.")),
    priceRange: z.enum(RESTAURANT_PRICE_RANGES).optional(),
    workingHours: createWorkingHoursSchema().optional(),
    deliveryAvailable: z.boolean().default(false),
    reservationsAvailable: z.boolean().default(false),
    menuUrl: z
      .string()
      .regex(URL_RE, t("Enter a valid URL."))
      .optional()
      .or(z.literal("")),
    location: createLocationSchema(t).optional(),
    phones: createPhonesSchema(t).optional(),
    socialLinks: createSocialLinksSchema(t).optional(),
  });
}
export type FoodDrinksBlockValues = z.infer<
  ReturnType<typeof createFoodDrinksBlockSchema>
>;

export function createHealthBlockSchema(t: Translate) {
  return z.object({
    category: z.literal("health"),
    specialty: z
      .string()
      .min(1, t("Please enter a specialty."))
      .max(60, t("Must be at most 60 characters.")),
    clinicAddress: z
      .string()
      .max(200, t("Must be at most 200 characters."))
      .optional(),
    workingHours: createWorkingHoursSchema().optional(),
    acceptsInsurance: z.boolean().default(false),
    appointmentPhone: z
      .string()
      .max(30, t("Must be at most 30 characters."))
      .optional(),
    consultationFee: z
      .string()
      .max(30, t("Must be at most 30 characters."))
      .optional(),
    location: createLocationSchema(t).optional(),
    phones: createPhonesSchema(t).optional(),
    socialLinks: createSocialLinksSchema(t).optional(),
  });
}
export type HealthBlockValues = z.infer<
  ReturnType<typeof createHealthBlockSchema>
>;

const GENERIC_CATEGORIES = [
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

/** Every category without bespoke fields yet — just an optional
 * free-text blurb plus the shared location/phones. Swap a category over
 * to its own schema above (and a matching branch in
 * `upsertBusinessBlockAction`) once it needs real structured fields. */
export function createGenericBlockSchema(t: Translate) {
  return z.object({
    category: z.enum(GENERIC_CATEGORIES),
    details: z
      .string()
      .max(300, t("Must be at most 300 characters."))
      .optional(),
    location: createLocationSchema(t).optional(),
    phones: createPhonesSchema(t).optional(),
    socialLinks: createSocialLinksSchema(t).optional(),
  });
}
export type GenericBlockValues = z.infer<
  ReturnType<typeof createGenericBlockSchema>
>;

export type BusinessBlockValues =
  | FoodDrinksBlockValues
  | HealthBlockValues
  | GenericBlockValues;
