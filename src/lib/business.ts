// The business form: everything an owner can change about their business,
// and the rules for it. One zod schema, used by the form (errors as you
// type) and again by the save action (the server never trusts the client).
// Error messages are translation keys — `<FormError>` shows them translated.
// Client-safe.

import { z } from "zod";

import type {
  BusinessLocation,
  BusinessProfile,
  OpeningHours,
} from "@/components/profile/fake-profile";
import { CATEGORY_SLUGS } from "@/lib/categories";
import type { MessageKey } from "@/lib/i18n/types";
import type { Localized } from "@/lib/localized";
import { SOCIAL_PLATFORMS, type SocialLink } from "@/lib/socials";

const m = (key: MessageKey) => key;

const REQUIRED = m("Required");
const TOO_LONG = m("Too long");

const optional = (max: number) => z.string().trim().max(max, TOO_LONG);
const required = (max: number) => optional(max).min(1, REQUIRED);

/** English required (it's the fallback), Arabic and French optional. */
const localized = (max: number) =>
  z.object({ en: required(max), ar: optional(max), fr: optional(max) });
/** All three optional (a bio can be left empty). */
const optionalLocalized = (max: number) =>
  z.object({ en: optional(max), ar: optional(max), fr: optional(max) });

export const USERNAME = /^[a-z0-9._]{3,30}$/;
// As people write numbers: "+20 100 123 4567", "0100-123-4567".
const PHONE = /^\+?[0-9 ()-]{8,20}$/;

/** Every kind of contact: WhatsApp, phone numbers, website, social accounts. */
export const LINK_PLATFORMS = Object.keys(SOCIAL_PLATFORMS) as (keyof typeof SOCIAL_PLATFORMS)[];
export type LinkPlatform = (typeof LINK_PLATFORMS)[number];

/** WhatsApp and phone take a number; everything else a web link. */
export const isNumberPlatform = (platform: LinkPlatform) =>
  platform === "whatsapp" || platform === "phone";

/** "instagram.com/x" → "https://instagram.com/x" (people skip the scheme). */
const withScheme = (url: string) =>
  /^https?:\/\//i.test(url) ? url : `https://${url}`;

const isWebLink = (url: string) => {
  try {
    return new URL(withScheme(url)).hostname.includes(".");
  } catch {
    return false;
  }
};

/** "24.0795, 32.8878" — what Google Maps copies when you tap a pin. */
const PIN = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

/** "24.0795, 32.8878" → { lat, lng }, or null if it isn't a valid pin. */
export const parsePin = (pin: string) => {
  const match = PIN.exec(pin);
  if (!match) return null;
  const [lat, lng] = [Number(match[1]), Number(match[2])];
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
};

export const formatPin = ({ lat, lng }: { lat: number; lng: number }) =>
  `${lat.toFixed(6).replace(/\.?0+$/, "")}, ${lng.toFixed(6).replace(/\.?0+$/, "")}`;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const isTimeZone = (zone: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

const OWNERS = ["me", "someone-else"] as const;
export type Owner = (typeof OWNERS)[number];

export const businessSchema = z.object({
  name: localized(100),
  username: z
    .string()
    .trim()
    .min(1, REQUIRED)
    .regex(USERNAME, m("3–30 lowercase letters, numbers, dots or underscores")),
  category: z.enum(
    CATEGORY_SLUGS,
    { error: m("Choose a category") },
  ),
  bio: optionalLocalized(300),
  /**
   * WhatsApp numbers, phone numbers, website and social accounts, in the
   * order they're shown. At least one WhatsApp (customers order there).
   * `url` holds the number for WhatsApp / phone.
   */
  links: z
    .array(
      z
        .object({
          platform: z.enum(LINK_PLATFORMS),
          url: z.string().trim().min(1, REQUIRED).max(300, TOO_LONG),
        })
        .superRefine(({ platform, url }, ctx) => {
          if (!url) return;
          if (isNumberPlatform(platform) ? !PHONE.test(url) : !isWebLink(url))
            ctx.addIssue({
              code: "custom",
              path: ["url"],
              message: isNumberPlatform(platform)
                ? m("Enter a valid phone number")
                : m("Enter a link, like instagram.com/yourname"),
            });
        }),
    )
    .max(15)
    .refine(
      (links) => links.some((link) => link.platform === "whatsapp"),
      m("Add at least one WhatsApp number"),
    ),
  /** Branches, at least one: the address as written + the map pin. */
  locations: z
    .array(
      z.object({
        address: localized(200),
        pin: z
          .string()
          .refine((pin) => parsePin(pin) !== null, m("Set the location on the map")),
      }),
    )
    .min(1)
    .max(20),
  /**
   * Sunday first. A closing time of 00:00 means midnight; 00:00–00:00 is
   * open all day.
   */
  hours: z
    .array(
      z
        .object({ open: z.boolean(), from: z.string(), to: z.string() })
        .superRefine(({ open, from, to }, ctx) => {
          if (!open) return;
          if (!TIME.test(from))
            ctx.addIssue({ code: "custom", path: ["from"], message: REQUIRED });
          if (!TIME.test(to))
            ctx.addIssue({ code: "custom", path: ["to"], message: REQUIRED });
          else if (to !== "00:00" && to <= from)
            ctx.addIssue({
              code: "custom",
              path: ["to"],
              message: m("Closes before it opens"),
            });
        }),
    )
    .length(7),
  timeZone: z.string().refine(isTimeZone, m("Choose a time zone")),
  /**
   * Shown only to whoever added the business: is it theirs (`ownerId` = them)
   * or someone else's (`ownerId` empty until the owner claims it;
   * `createdBy` is them either way).
   */
  owner: z.enum(OWNERS),
});

export type BusinessFormValues = z.infer<typeof businessSchema>;

const DEFAULT_HOURS = { open: true, from: "09:00", to: "21:00" };

/** A new business: nothing filled in, open every day 9–9. */
export const EMPTY_BUSINESS: BusinessFormValues = {
  name: { en: "", ar: "", fr: "" },
  username: "",
  category: "",
  bio: { en: "", ar: "", fr: "" },
  links: [{ platform: "whatsapp", url: "" }],
  locations: [{ address: { en: "", ar: "", fr: "" }, pin: "" }],
  hours: Array.from({ length: 7 }, () => DEFAULT_HOURS),
  timeZone: "Africa/Cairo",
  owner: "me",
};

const fill = (text: Localized) => ({
  en: text.en,
  ar: text.ar ?? "",
  fr: text.fr ?? "",
});

/** Drops the languages left empty. */
const compact = (text: { en: string; ar: string; fr: string }): Localized => ({
  en: text.en,
  ...(text.ar && { ar: text.ar }),
  ...(text.fr && { fr: text.fr }),
});

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
    socials: socials as BusinessProfile["socials"],
    locations: values.locations.map(
      ({ address, pin }): BusinessLocation => ({
        description: compact(address),
        coords: parsePin(pin)!,
      }),
    ) as BusinessProfile["locations"],
    hours: values.hours.map(
      ({ open, from, to }): OpeningHours | null =>
        open ? { open: from, close: to === "00:00" ? "24:00" : to } : null,
    ),
    timeZone: values.timeZone,
  } satisfies Omit<BusinessProfile, "kind" | "avatarUrl" | "verified" | "stats">;
}
