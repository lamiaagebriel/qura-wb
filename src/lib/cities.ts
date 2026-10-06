// Cities Qura covers, as a two-level tree: a city and its sub-cities
// (Aswan → Kom Ombo, Edfu…). Each business branch belongs to one at either
// level (stored as the slug — never rename one). Picking a city shows it
// and all its sub-cities; picking a sub-city shows only that one. `center` locates a pin's nearest city (seed backfill, form
// default). Client-safe.

import type { Locale } from "@/lib/i18n/config";

export type City = {
  slug: string;
  /** The city this one is part of; `null` at the top. */
  parent: string | null;
  name: Record<Locale, string>;
  center: { lat: number; lng: number };
};

export const CITIES = [
  {
    slug: "aswan",
    parent: null,
    name: { en: "Aswan", ar: "أسوان", fr: "Assouan" },
    center: { lat: 24.0889, lng: 32.8998 },
  },
  {
    slug: "kom-ombo",
    parent: "aswan",
    name: { en: "Kom Ombo", ar: "كوم أمبو", fr: "Kom Ombo" },
    center: { lat: 24.4769, lng: 32.9468 },
  },
  {
    slug: "edfu",
    parent: "aswan",
    name: { en: "Edfu", ar: "إدفو", fr: "Edfou" },
    center: { lat: 24.9781, lng: 32.8734 },
  },
  {
    slug: "daraw",
    parent: "aswan",
    name: { en: "Daraw", ar: "دراو", fr: "Daraou" },
    center: { lat: 24.4003, lng: 32.9306 },
  },
  {
    slug: "abu-simbel",
    parent: "aswan",
    name: { en: "Abu Simbel", ar: "أبو سمبل", fr: "Abou Simbel" },
    center: { lat: 22.3372, lng: 31.6258 },
  },
  {
    slug: "luxor",
    parent: null,
    name: { en: "Luxor", ar: "الأقصر", fr: "Louxor" },
    center: { lat: 25.6872, lng: 32.6396 },
  },
  {
    slug: "qena",
    parent: null,
    name: { en: "Qena", ar: "قنا", fr: "Qena" },
    center: { lat: 26.1551, lng: 32.716 },
  },
] as const satisfies readonly City[];

export type CitySlug = (typeof CITIES)[number]["slug"];

export const CITY_SLUGS = CITIES.map((c) => c.slug) as [CitySlug, ...CitySlug[]];

export const DEFAULT_CITY: CitySlug = "aswan";

const BY_SLUG = new Map<string, City>(CITIES.map((c) => [c.slug, c]));

export const cityOf = (slug: string | null | undefined) =>
  slug ? BY_SLUG.get(slug) : undefined;

/** Top-level cities, each with its sub-cities (for pickers). */
export const CITY_TREE = CITIES.filter((c) => c.parent === null).map((city) => ({
  ...city,
  children: CITIES.filter((c) => c.parent === city.slug),
}));

/** `slug` and its sub-cities: what picking it shows. */
export const cityAndSubs = (slug: CitySlug): CitySlug[] =>
  CITIES.filter((c) => c.slug === slug || c.parent === slug).map((c) => c.slug);

export const isCity = (slug: unknown): slug is CitySlug =>
  typeof slug === "string" && BY_SLUG.has(slug);

/** The city whose center is closest to `coords` (flat-earth is fine here). */
export function nearestCity(coords: { lat: number; lng: number }): CitySlug {
  let best: CitySlug = DEFAULT_CITY;
  let bestDistance = Infinity;
  for (const city of CITIES) {
    const d =
      (city.center.lat - coords.lat) ** 2 + (city.center.lng - coords.lng) ** 2;
    if (d < bestDistance) [best, bestDistance] = [city.slug, d];
  }
  return best;
}

export const CITY_COOKIE = "qura__city";
export const CITY_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax",
} as const;
