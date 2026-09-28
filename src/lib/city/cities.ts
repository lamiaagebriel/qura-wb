import { CITIES, type CityId } from "@/db/schema/cities";
import type { Dict } from "@/lib/i18n/config";

// Cities with real content — anything in `CITIES` left out of this list
// is a valid, insertable enum value the UI treats as "coming soon" (see
// `isCityAvailable` and `ComingSoon`). Every city has seeded content now
// (`db/seed.ts` + `db/seed-cities.ts`).
export const AVAILABLE_CITIES: CityId[] = [...CITIES];

export function isCityAvailable(city: CityId): boolean {
  return AVAILABLE_CITIES.includes(city);
}

// The order the city switcher lists them in — available cities first
// (real content), then the rest.
export const CITY_ORDER: CityId[] = [
  ...AVAILABLE_CITIES,
  ...CITIES.filter((c) => !AVAILABLE_CITIES.includes(c)),
];

export const CITY_LABEL: Record<CityId, keyof Dict> = {
  aswan: "Aswan",
  luxor: "Luxor",
  cairo: "Cairo",
  alexandria: "Alexandria",
  qena: "Qena",
  hurghada: "Hurghada",
  "sharm-el-sheikh": "Sharm El Sheikh",
  sohag: "Sohag",
  "marsa-alam": "Marsa Alam",
};

// Real city centers — used both to bias/scope a Google Places search to
// the active city (`lib/search/unified-search.ts`) and to frame the
// search map when there's nothing to pin yet (`SearchView`). Limited to
// `AVAILABLE_CITIES` (the only ones with real content); nothing reads
// this for an unavailable city. Plain data, no `"server-only"` — safe
// to import from either side.
export const CITY_CENTER: Partial<Record<CityId, { lat: number; lng: number }>> = {
  aswan: { lat: 24.0889, lng: 32.8998 },
  luxor: { lat: 25.6872, lng: 32.6396 },
  cairo: { lat: 30.0444, lng: 31.2357 },
  alexandria: { lat: 31.2001, lng: 29.9187 },
  qena: { lat: 26.1551, lng: 32.716 },
  hurghada: { lat: 27.2579, lng: 33.8116 },
  "sharm-el-sheikh": { lat: 27.9158, lng: 34.33 },
  sohag: { lat: 26.5591, lng: 31.6957 },
  "marsa-alam": { lat: 25.0676, lng: 34.879 },
};
