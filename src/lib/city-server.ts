import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { CITY_COOKIE, DEFAULT_CITY, isCity, type CitySlug } from "./cities";

/** The city the visitor picked (cookie), or the default one. */
export const getCity = cache(async (): Promise<CitySlug> => {
  const saved = (await cookies()).get(CITY_COOKIE)?.value;
  return isCity(saved) ? saved : DEFAULT_CITY;
});
