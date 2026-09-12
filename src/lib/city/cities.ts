import { CITIES, type CityId } from "@/db/schema/cities";
import type { Dict } from "@/lib/i18n/config";

// Real content exists for these two — everything else in `CITIES` is a
// valid, insertable enum value but has no seeded businesses/threads yet,
// so the UI treats it as "coming soon" (see `isCityAvailable` and
// `ComingSoon`).
export const AVAILABLE_CITIES: CityId[] = ["aswan", "luxor"];

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
};
