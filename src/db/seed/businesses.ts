// Sample businesses for local development and e2e tests — loaded by
// `pnpm db:seed` (src/db/seed.ts), never in production.

import type { BusinessLocation, BusinessProfile, OpeningHours } from "@/lib/business";
import type { Localized } from "@/lib/localized";

/** A business as seeded: everything but what's counted (followers). */
export type SeedBusiness = Omit<BusinessProfile, "stats">;

/** `loc({ en: "Old Souq, Aswan" }, 24.0965, 32.901)` */
const loc = (description: Localized, lat: number, lng: number): BusinessLocation => ({
  description,
  coords: { lat, lng },
});
const h = (open: string, close: string): OpeningHours => ({ open, close });
const everyDay = (slot: OpeningHours) => Array.from({ length: 7 }, () => slot);
const DAY = h("08:00", "23:00");

export const SEED_BUSINESSES: SeedBusiness[] = [
  {
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
    },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
];

/**
 * The e2e test user (e2e/auth.ts) owns two sample businesses, so "My
 * businesses" has something to show: one they added themselves, and one
 * someone else added for them (they can edit it but not pick its owner).
 */
export const SEED_OWNER = { email: "e2e@qura.test", name: "E2E Tester", username: "e2e_tester" };
export const SEED_OWNED: Record<string, { addedByOwner: boolean }> = {
  nilebreeze: { addedByOwner: true },
  "aswan.eats": { addedByOwner: false },
};
