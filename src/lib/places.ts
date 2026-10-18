// Places: a tree with no depth limit (Aswan → Edfu → a neighborhood…),
// stored in the `places` table and loaded whole (`lib/data/places.ts`) —
// these helpers work on that list, on the server and in the browser.
// Posts and branches point at a place's `slug` and show in it and every
// place above it. Client-safe.

import type { Locale } from "@/lib/i18n/config";
import { inLocale, type Localized } from "@/lib/localized";

export type Place = {
  id: string;
  slug: string;
  parentId: string | null;
  typeId: string;
  name: Localized;
  center: { lat: number; lng: number } | null;
};

export type PlaceTypeOption = { id: string; name: Localized };

/** Where a visitor starts, before picking a place. */
export const DEFAULT_PLACE = "aswan";

export const PLACE_COOKIE = "qura__city";
export const PLACE_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax",
} as const;

/** Lookups over one list of places, built once per list. */
export function placeIndex(places: Place[]) {
  const bySlug = new Map(places.map((p) => [p.slug, p]));
  const byId = new Map(places.map((p) => [p.id, p]));
  const children = new Map<string | null, Place[]>();
  for (const place of places) {
    const list = children.get(place.parentId) ?? [];
    list.push(place);
    children.set(place.parentId, list);
  }

  const childrenOf = (id: string | null) => children.get(id) ?? [];

  return {
    all: places,
    get: (slug: string | null | undefined) =>
      slug ? bySlug.get(slug) : undefined,
    getById: (id: string | null | undefined) =>
      id ? byId.get(id) : undefined,
    has: (slug: unknown): slug is string =>
      typeof slug === "string" && bySlug.has(slug),
    childrenOf,
    /** `slug` and every place under it, at any depth: what picking it shows. */
    subtree(slug: string): string[] {
      const root = bySlug.get(slug);
      if (!root) return [];
      const out: string[] = [];
      const stack = [root];
      while (stack.length) {
        const place = stack.pop()!;
        out.push(place.slug);
        stack.push(...childrenOf(place.id));
      }
      return out;
    },
    /** From the top down to `slug` (itself last). */
    path(slug: string): Place[] {
      const out: Place[] = [];
      let place = bySlug.get(slug);
      while (place) {
        out.unshift(place);
        place = place.parentId ? byId.get(place.parentId) : undefined;
      }
      return out;
    },
    /** The place with a center closest to `coords` (flat-earth is fine). */
    nearest(coords: { lat: number; lng: number }): string {
      let best = DEFAULT_PLACE;
      let bestDistance = Infinity;
      for (const place of places) {
        if (!place.center) continue;
        const d =
          (place.center.lat - coords.lat) ** 2 +
          (place.center.lng - coords.lng) ** 2;
        if (d < bestDistance) [best, bestDistance] = [place.slug, d];
      }
      return best;
    },
  };
}

export type PlaceIndex = ReturnType<typeof placeIndex>;

/** A place's name in `locale`. */
export const placeName = (place: Place, locale: Locale) =>
  inLocale(place.name, locale);

/** "Edfu, Aswan": the place and the one above it, for context. */
export function placeLabel(index: PlaceIndex, slug: string, locale: Locale) {
  const path = index.path(slug);
  if (!path.length) return slug;
  return path
    .slice(-2)
    .reverse()
    .map((place) => placeName(place, locale))
    .join(locale === "ar" ? "، " : ", ");
}

/** A URL-safe slug from an English name ("Kom Ombo" → "kom-ombo"). */
export const slugify = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
