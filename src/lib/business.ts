// A business as the screens show it (read from `server/queries/businesses.ts`),
// and turning it into the business form's values and back (the form's
// schema is `lib/validations/business-form.ts`). Client-safe.

import type { CategorySlug } from "@/lib/categories";
import type { BusinessStatus } from "@/lib/business-status";
import { compactLocalized, fillLocalized, type Localized } from "@/lib/localized";
import type { SocialLink } from "@/lib/socials";
import {
  DEFAULT_HOURS,
  formatPin,
  parsePin,
  withScheme,
  type BusinessFormValues,
  type Owner,
} from "@/lib/validations/business-form";

/** Opening time and closing time, "HH:MM" (24h, same day; "24:00" = midnight). */
export type OpeningHours = { open: string; close: string };

/** One branch: its address as the owner wrote it, the map pin and its city. */
export type BusinessLocation = {
  description: Localized;
  coords: { lat: number; lng: number };
  /** A place slug (`places`). */
  city: string;
};

/** A business's public page. */
export type BusinessProfile = {
  username: string;
  avatarUrl: string | null;
  verified: boolean;
  /** Written by the owner in English, Arabic or both (at least one). */
  name: Localized;
  bio: Localized;
  /** What the business is — a slug from the category tree (lib/categories.ts), any level. */
  category: CategorySlug;
  /** Its branches: the address as written, and the pin (the form asks for one; other data may have none). */
  locations: BusinessLocation[];
  /**
   * WhatsApp first (the form requires it: customers order there; other
   * data may lack it), then the website and other accounts in the order
   * the owner listed them.
   */
  socials: SocialLink[];
  /** Sunday first (index = `Date#getDay()`); `null` = closed that day. */
  hours: (OpeningHours | null)[];
  /** IANA zone the hours are in. */
  timeZone: string;
  stats: { followers: number };
};

/** A business in a list (search, a category, yours): plain data, client-safe. */
export type BusinessSummary = Pick<
  BusinessProfile,
  "name" | "username" | "category" | "verified" | "avatarUrl"
> & {
  /** The places its branches are in (slugs, each once). */
  cities: string[];
  status: BusinessStatus;
};

const fill = fillLocalized;
const compact = compactLocalized;

/** A stored business, as the form shows it. */
export function businessToForm(
  business: BusinessProfile,
  owner: Owner,
): BusinessFormValues {
  return {
    name: fill(business.name),
    username: business.username,
    category: business.category,
    bio: fill(business.bio),
    links: business.socials.map(({ platform, url }) => ({
      platform,
      url:
        platform === "whatsapp"
          ? `+${url.replace(/\D/g, "")}`
          : platform === "phone"
            ? url.replace(/^tel:/, "")
            : url,
    })),
    locations: business.locations.map((location) => ({
      address: fill(location.description),
      city: location.city,
      pin: formatPin(location.coords),
    })),
    hours: business.hours.map((slot) =>
      slot
        ? {
            open: true,
            from: slot.open,
            to: slot.close === "24:00" ? "00:00" : slot.close,
          }
        : { ...DEFAULT_HOURS, open: false },
    ),
    timeZone: business.timeZone,
    owner,
  };
}

/** What gets stored: the parsed form, in `BusinessProfile`'s shape. */
export function formToBusiness(values: BusinessFormValues) {
  // WhatsApp first: the profile's "Order on WhatsApp" uses the first one.
  const socials: SocialLink[] = [
    ...values.links.filter((link) => link.platform === "whatsapp"),
    ...values.links.filter((link) => link.platform !== "whatsapp"),
  ].map(({ platform, url }) => ({
    platform,
    url:
      platform === "whatsapp"
        ? `https://wa.me/${url.replace(/\D/g, "")}`
        : platform === "phone"
          ? `tel:${url}`
          : withScheme(url),
  }));
  return {
    name: compact(values.name),
    username: values.username,
    category: values.category as BusinessProfile["category"],
    bio: compact(values.bio),
    socials,
    locations: values.locations.map(
      ({ address, city, pin }): BusinessLocation => ({
        description: compact(address),
        city,
        coords: parsePin(pin)!,
      }),
    ),
    hours: values.hours.map(
      ({ open, from, to }): OpeningHours | null =>
        open ? { open: from, close: to === "00:00" ? "24:00" : to } : null,
    ),
    timeZone: values.timeZone,
  } satisfies Omit<BusinessProfile, "avatarUrl" | "verified" | "stats">;
}
