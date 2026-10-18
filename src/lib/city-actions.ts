"use server";

import { cookies } from "next/headers";

import { getPlaceIndex } from "./data/places";
import { PLACE_COOKIE, PLACE_COOKIE_OPTIONS } from "./places";

/** Saves the place picked; Next re-renders the page for it in the same roundtrip. */
export async function setCity(slug: unknown) {
  if (!(await getPlaceIndex()).has(slug)) return;

  (await cookies()).set(PLACE_COOKIE, slug, PLACE_COOKIE_OPTIONS);
}
