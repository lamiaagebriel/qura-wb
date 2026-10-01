// TEMPORARY: other people's business profiles, as a visitor sees them
// (Search → a business). Replace with a `profiles` query once the UI is
// signed off.

import { pathOf, subtreeOf } from "@/lib/categories";
import { allLanguages } from "@/lib/localized";

import {
  FAKE_BUSINESS_PROFILE,
  loc,
  type BusinessProfile,
  type OpeningHours,
} from "./fake-profile";

const h = (open: string, close: string): OpeningHours => ({ open, close });
const everyDay = (slot: OpeningHours) => Array.from({ length: 7 }, () => slot);

const FAKE_BUSINESSES: BusinessProfile[] = [
  FAKE_BUSINESS_PROFILE,
  {
    kind: "business",
    name: { en: "Aswan Eats", ar: "مطاعم أسوان", fr: "Saveurs d'Assouan" },
    username: "aswan.eats",
    avatarUrl: null,
    verified: true,
    category: "restaurant",
    bio: {
      en: "Koshary, grilled fish and home-style Nubian dishes.\nDelivery all over Aswan 🛵",
      ar: "كشري وسمك مشوي وأكلات نوبية بيتي.\nتوصيل لكل أسوان 🛵",
      fr: "Koshari, poisson grillé et plats nubiens maison.\nLivraison dans tout Assouan 🛵",
    },
    locations: [
      loc(
        {
          en: "Abtal El Tahrir St, near the train station, Aswan",
          ar: "شارع أبطال التحرير، قرب محطة القطار، أسوان",
          fr: "Rue Abtal El Tahrir, près de la gare, Assouan",
        },
        24.0995,
        32.9025,
      ),
      loc(
        {
          en: "Sadat Rd, next to Aswan University, Aswan",
          ar: "طريق السادات، بجوار جامعة أسوان، أسوان",
          fr: "Route Sadate, à côté de l'université d'Assouan",
        },
        24.0745,
        32.8795,
      ),
    ],
    socials: [
      { platform: "whatsapp", url: "https://wa.me/201002345678" },
      { platform: "phone", url: "tel:+20 100 234 5678" },
      { platform: "phone", url: "tel:+20 97 244 1122" },
      { platform: "facebook", url: "https://facebook.com/aswaneats" },
      { platform: "instagram", url: "https://instagram.com/aswan.eats" },
      { platform: "tiktok", url: "https://tiktok.com/@aswan.eats" },
    ],
    hours: everyDay(h("12:00", "24:00")),
    timeZone: "Africa/Cairo",
    stats: { followers: 8410 },
  },
  {
    kind: "business",
    name: {
      en: "Nile View Hotel",
      ar: "فندق إطلالة النيل",
      fr: "Hôtel Vue sur le Nil",
    },
    username: "nileview",
    avatarUrl: null,
    verified: true,
    category: "hotel",
    bio: {
      en: "Rooms with a balcony over the Nile, rooftop breakfast and airport pickup.",
      ar: "غرف بشرفة على النيل، فطور على السطح وتوصيل من المطار.",
      fr: "Chambres avec balcon sur le Nil, petit-déjeuner en terrasse et navette aéroport.",
    },
    locations: [
      loc(
        {
          en: "Corniche El Nil, Aswan",
          ar: "كورنيش النيل، أسوان",
          fr: "Corniche du Nil, Assouan",
        },
        24.0905,
        32.897,
      ),
    ],
    socials: [
      { platform: "whatsapp", url: "https://wa.me/201205550101" },
      { platform: "phone", url: "tel:+20 97 230 0000" },
      { platform: "phone", url: "tel:+20 97 230 0001" },
      { platform: "phone", url: "tel:+20 120 555 0101" },
      { platform: "website", url: "https://nileview.example" },
      { platform: "facebook", url: "https://facebook.com/nileviewaswan" },
      { platform: "instagram", url: "https://instagram.com/nileview.aswan" },
      { platform: "x", url: "https://x.com/nileviewaswan" },
      { platform: "youtube", url: "https://youtube.com/@nileviewaswan" },
    ],
    hours: everyDay(h("00:00", "24:00")),
    timeZone: "Africa/Cairo",
    stats: { followers: 23100 },
  },
  {
    kind: "business",
    name: { en: "Elephantine Felucca Tours", ar: "رحلات فلوكة إلفنتين" },
    username: "felucca.tours",
    avatarUrl: null,
    verified: false,
    category: "tourism",
    bio: {
      en: "Sunset felucca rides, Nubian village visits and Philae day trips.\nBook a day ahead ⛵",
      ar: "جولات فلوكة وقت الغروب وزيارات للقرية النوبية ورحلات إلى فيلة.\nاحجز قبلها بيوم ⛵",
    },
    locations: [
      loc(
        {
          en: "Felucca dock, Corniche El Nil, Aswan",
          ar: "مرسى الفلوكة، كورنيش النيل، أسوان",
        },
        24.0935,
        32.896,
      ),
    ],
    socials: [
      { platform: "whatsapp", url: "https://wa.me/201223456789" },
      { platform: "phone", url: "tel:+20 122 345 6789" },
      { platform: "instagram", url: "https://instagram.com/felucca.tours" },
      { platform: "youtube", url: "https://youtube.com/@feluccatours" },
    ],
    // Sunday → Saturday; closed on Fridays.
    hours: [
      h("07:00", "19:00"),
      h("07:00", "19:00"),
      h("07:00", "19:00"),
      h("07:00", "19:00"),
      h("07:00", "19:00"),
      null,
      h("07:00", "19:00"),
    ],
    timeZone: "Africa/Cairo",
    stats: { followers: 3920 },
  },
  {
    kind: "business",
    name: {
      en: "El Shifa Pharmacy",
      ar: "صيدلية الشفاء",
      fr: "Pharmacie El Shifa",
    },
    username: "elshifa",
    avatarUrl: null,
    verified: true,
    category: "pharmacy",
    bio: {
      en: "Medicines, baby care and cosmetics. Free home delivery nearby.",
      ar: "أدوية ومستلزمات أطفال ومستحضرات تجميل. توصيل مجاني للمنازل القريبة.",
      fr: "Médicaments, soins bébé et cosmétiques. Livraison gratuite à proximité.",
    },
    locations: [
      loc(
        {
          en: "El Souq St, Aswan",
          ar: "شارع السوق، أسوان",
          fr: "Rue du Souk, Assouan",
        },
        24.096,
        32.9005,
      ),
    ],
    socials: [
      { platform: "whatsapp", url: "https://wa.me/201557008899" },
      { platform: "phone", url: "tel:+20 97 231 4455" },
      { platform: "phone", url: "tel:+20 155 700 8899" },
      { platform: "facebook", url: "https://facebook.com/elshifa.pharmacy" },
    ],
    hours: everyDay(h("09:00", "24:00")),
    timeZone: "Africa/Cairo",
    stats: { followers: 1270 },
  },
  {
    kind: "business",
    name: { en: "Salon Nefertari", ar: "صالون نفرتاري" },
    username: "salon.nefertari",
    avatarUrl: null,
    verified: false,
    category: "salon",
    bio: {
      en: "Hair, henna and bridal make-up. Women only 💇‍♀️",
      ar: "شعر وحنة ومكياج عرائس. للسيدات فقط 💇‍♀️",
    },
    locations: [
      loc(
        {
          en: "Kornish Tower, 2nd floor, Aswan",
          ar: "برج الكورنيش، الدور الثاني، أسوان",
        },
        24.088,
        32.899,
      ),
    ],
    socials: [
      { platform: "whatsapp", url: "https://wa.me/201009998877" },
      { platform: "instagram", url: "https://instagram.com/salon.nefertari" },
      { platform: "tiktok", url: "https://tiktok.com/@salon.nefertari" },
    ],
    // Closed on Sundays, late opening on Fridays.
    hours: [
      null,
      h("11:00", "21:00"),
      h("11:00", "21:00"),
      h("11:00", "21:00"),
      h("11:00", "22:00"),
      h("15:00", "22:00"),
      h("11:00", "21:00"),
    ],
    timeZone: "Africa/Cairo",
    stats: { followers: 640 },
  },
  {
    kind: "business",
    name: { en: "Souq Spices", ar: "توابل السوق", fr: "Épices du Souk" },
    username: "souq.spices",
    avatarUrl: null,
    verified: false,
    category: "grocery",
    bio: { en: "" },
    locations: [
      loc(
        {
          en: "Old Souq, Aswan",
          ar: "السوق القديم، أسوان",
          fr: "Vieux souk, Assouan",
        },
        24.0965,
        32.901,
      ),
    ],
    socials: [
      { platform: "whatsapp", url: "https://wa.me/201112223344" },
      { platform: "phone", url: "tel:+20 111 222 3344" },
    ],
    hours: everyDay(h("10:00", "23:00")),
    timeZone: "Africa/Cairo",
    stats: { followers: 95 },
  },
];

export const fakeBusiness = (username: string) =>
  FAKE_BUSINESSES.find((b) => b.username === username);

/** What the Search list needs (plain data, safe to send to the client). */
export type BusinessSummary = Pick<
  BusinessProfile,
  "name" | "username" | "category" | "verified" | "avatarUrl"
>;

const summaryOf = ({
  name,
  username,
  category,
  verified,
  avatarUrl,
}: BusinessProfile): BusinessSummary => ({
  name,
  username,
  category,
  verified,
  avatarUrl,
});

/**
 * Businesses whose name, handle, category or description (in any
 * language) contains `query`.
 */
export function searchFakeBusinesses(query: string): BusinessSummary[] {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return [];
  return FAKE_BUSINESSES.filter((business) =>
    [
      ...allLanguages(business.name),
      business.username,
      // Its category and every parent ("salon" finds nail bars too).
      ...pathOf(business.category).flatMap((c) => Object.values(c.name)),
      ...allLanguages(business.bio),
    ].some((text) => text.toLocaleLowerCase().includes(q)),
  ).map(summaryOf);
}

// The businesses you manage (Profile → My businesses). `createdByMe`: you
// added it (`createdBy`); `ownedByMe`: it's yours (`ownerId`). Whoever adds
// a business may add it for someone else (`ownerId` empty).
const MINE: Record<string, { createdByMe: boolean; ownedByMe: boolean }> = {
  nilebreeze: { createdByMe: true, ownedByMe: true },
  "aswan.eats": { createdByMe: false, ownedByMe: true },
};

export const FAKE_MY_BUSINESSES = FAKE_BUSINESSES.filter((b) =>
  Object.hasOwn(MINE, b.username),
).map(summaryOf);

/**
 * One of your businesses (to edit) and your part in it, or `undefined` if
 * it isn't yours.
 */
export function fakeMyBusiness(username: string) {
  const business = Object.hasOwn(MINE, username)
    ? fakeBusiness(username)
    : undefined;
  return business && { business, ...MINE[username] };
}

/** Some business already uses this @handle. */
export const fakeUsernameTaken = (username: string) =>
  FAKE_BUSINESSES.some((b) => b.username === username);

/** Businesses in category `slug` or anywhere under it. */
export function fakeBusinessesIn(slug: string): BusinessSummary[] {
  const slugs = subtreeOf(slug);
  return FAKE_BUSINESSES.filter((b) => slugs.has(b.category)).map(summaryOf);
}

/** How many businesses each category has, counting its whole subtree. */
export function fakeCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const b of FAKE_BUSINESSES)
    for (const c of pathOf(b.category)) counts[c.slug] = (counts[c.slug] ?? 0) + 1;
  return counts;
}
