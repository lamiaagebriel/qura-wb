"use server";

import { cookies } from "next/headers";

import { CITY_COOKIE, CITY_COOKIE_OPTIONS, isCity } from "./cities";

/** Saves the choice; Next re-renders the page for the new city in the same roundtrip. */
export async function setCity(city: string) {
  if (!isCity(city)) return;

  (await cookies()).set(CITY_COOKIE, city, CITY_COOKIE_OPTIONS);
}
