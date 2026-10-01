// TEMPORARY: stand-in data while the profile UI is being designed. Replace
// with the signed-in user's profile (db: `profiles`) once the UI is signed off.

import type { CategorySlug } from "@/lib/categories";
import type { Localized } from "@/lib/localized";
import type { SocialLink, WhatsappLink } from "@/lib/socials";

type ProfileBase = {
  username: string;
  avatarUrl: string | null;
  verified: boolean;
};

export type PersonalProfile = ProfileBase & {
  kind: "personal";
  name: string;
  bio: string;
  stats: { followers: number; following: number };
};

/** Opening time and closing time, "HH:MM" (24h, same day). */
export type OpeningHours = { open: string; close: string };

/** One branch: its address as the owner wrote it, and the map pin. */
export type BusinessLocation = {
  description: Localized;
  coords: { lat: number; lng: number };
};

/** Shorthand for fake data: `loc({ en: "Old Souq, Aswan" }, 24.0965, 32.901)`. */
export const loc = (
  description: Localized,
  lat: number,
  lng: number,
): BusinessLocation => ({ description, coords: { lat, lng } });

export type BusinessProfile = ProfileBase & {
  kind: "business";
  /** Written by the owner in English, and optionally Arabic / French. */
  name: Localized;
  bio: Localized;
  /** What the business is — a slug from the category tree (lib/categories.ts), any level. */
  category: CategorySlug;
  /** Its branches (at least one): the address as written, and the pin. */
  locations: [BusinessLocation, ...BusinessLocation[]];
  /**
   * WhatsApp first — required (customers order there) — then the website
   * and other accounts in the order the owner listed them.
   */
  socials: [WhatsappLink, ...SocialLink[]];
  /** Sunday first (index = `Date#getDay()`); `null` = closed that day. */
  hours: (OpeningHours | null)[];
  /** IANA zone the hours are in. */
  timeZone: string;
  stats: { followers: number };
};

export type ProfileData = PersonalProfile | BusinessProfile;

const DAY = { open: "08:00", close: "23:00" };

export const FAKE_BUSINESS_PROFILE: BusinessProfile = {
  kind: "business",
  name: {
    en: "Nile Breeze Café",
    ar: "مقهى نسيم النيل",
    fr: "Café Brise du Nil",
  },
  username: "nilebreeze",
  avatarUrl: null,
  verified: true,
  category: "cafe",
  bio: {
    en: "Coffee, fresh juices and Nubian breakfast on the Corniche 🌅\nFamily seating and a terrace facing Elephantine Island.",
    ar: "قهوة وعصائر طازجة وفطور نوبي على الكورنيش 🌅\nجلسات عائلية وتراس يطل على جزيرة إلفنتين.",
    fr: "Café, jus frais et petit-déjeuner nubien sur la Corniche 🌅\nCoin famille et terrasse face à l'île Éléphantine.",
  },
  locations: [
    loc(
      {
        en: "Corniche El Nil, next to the Old Cataract, Aswan",
        ar: "كورنيش النيل، بجوار فندق أولد كتاراكت، أسوان",
        fr: "Corniche du Nil, à côté de l'Old Cataract, Assouan",
      },
      24.0795,
      32.8878,
    ),
  ],
  socials: [
    { platform: "whatsapp", url: "https://wa.me/201009876543" },
    { platform: "phone", url: "tel:+20 97 123 4567" },
    { platform: "phone", url: "tel:+20 100 987 6543" },
    { platform: "website", url: "https://nilebreeze.example" },
    { platform: "instagram", url: "https://instagram.com/nilebreeze.cafe" },
    { platform: "facebook", url: "https://facebook.com/nilebreezecafe" },
    { platform: "tiktok", url: "https://tiktok.com/@nilebreeze" },
  ],
  // Sunday → Saturday; closed on Mondays, late on Thursday and Friday.
  hours: [
    DAY,
    null,
    DAY,
    DAY,
    { open: "08:00", close: "24:00" },
    { open: "13:00", close: "24:00" },
    DAY,
  ],
  timeZone: "Africa/Cairo",
  stats: { followers: 12840 },
};
