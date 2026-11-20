import "server-only";

import { asc, eq, sql, type AnyColumn } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { cache } from "react";

import { db } from "@/db";
import { places, placeTypes } from "@/db/schema";
import {
  DEFAULT_PLACE,
  PLACE_COOKIE,
  placeIndex,
  type Place,
  type PlaceTypeOption,
} from "@/lib/places";

/** On every cached places read; a write that adds or changes one revalidates it. */
export const PLACES_TAG = "places";

/**
 * Every place (small: loaded whole). Cached until the app changes one —
 * and for 5 minutes at most, for changes made outside it (SQL, scripts).
 */
export const getPlaces = unstable_cache(
  async (): Promise<Place[]> => {
    const rows = await db.select().from(places).orderBy(asc(places.createdAt));
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      parentId: row.parentId,
      typeId: row.typeId,
      name: row.name,
      center:
        row.lat !== null && row.lng !== null
          ? { lat: row.lat, lng: row.lng }
          : null,
    }));
  },
  ["places"],
  { tags: [PLACES_TAG], revalidate: 300 },
);

/** Lookups over every place, once per request. */
export const getPlaceIndex = cache(async () => placeIndex(await getPlaces()));

/** The listed place types, offered when requesting a place. */
export const getPlaceTypes = unstable_cache(
  async (): Promise<PlaceTypeOption[]> =>
    db
      .select({ id: placeTypes.id, name: placeTypes.name })
      .from(placeTypes)
      .where(eq(placeTypes.listed, true))
      .orderBy(asc(placeTypes.createdAt)),
  ["place-types"],
  { tags: [PLACES_TAG], revalidate: 300 },
);

/** The place the visitor picked (cookie), or the default one. */
export const getCurrentPlace = cache(async (): Promise<string> => {
  const [saved, index] = await Promise.all([
    cookies().then((store) => store.get(PLACE_COOKIE)?.value),
    getPlaceIndex(),
  ]);
  return index.has(saved) ? saved : DEFAULT_PLACE;
});

/**
 * `column` (a place id) is the place with this `slug` or any place under
 * it, at any depth — one recursive query, so feeds stay a single round trip.
 */
export const inPlaceTree = (column: AnyColumn, slug: string) => sql`${column} in (
  with recursive tree as (
    select id from places where slug = ${slug}
    union all
    select p.id from places p join tree on p.parent_id = tree.id
  )
  select id from tree
)`;
