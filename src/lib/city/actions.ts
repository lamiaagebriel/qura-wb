"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { CITIES, type CityId } from "@/db/schema/cities";

// Same pattern as `lib/i18n/actions.ts`'s locale cookie — plain,
// unsigned, just "which city's content to show." A page reload after
// switching (`revalidatePath`) is what actually applies it, same as
// switching language.
const ACTIVE_CITY_COOKIE = "qura__active_city";
const DEFAULT_CITY: CityId = "aswan";

export async function setActiveCity(city: CityId) {
  if (!(CITIES as readonly string[]).includes(city)) return;
  const jar = await cookies();
  jar.set(ACTIVE_CITY_COOKIE, city, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

export async function getActiveCity(): Promise<CityId> {
  const jar = await cookies();
  const value = jar.get(ACTIVE_CITY_COOKIE)?.value;
  return (CITIES as readonly string[]).includes(value ?? "")
    ? (value as CityId)
    : DEFAULT_CITY;
}
