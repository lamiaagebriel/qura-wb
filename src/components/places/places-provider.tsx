"use client";

import { createContext, use, useMemo, type ReactNode } from "react";

import { placeIndex, type Place, type PlaceIndex } from "@/lib/places";

const PlacesContext = createContext<PlaceIndex | null>(null);

/** Every place, from the root layout (cached server-side), for any screen. */
export function PlacesProvider({
  places,
  children,
}: {
  places: Place[];
  children: ReactNode;
}) {
  const index = useMemo(() => placeIndex(places), [places]);
  return <PlacesContext value={index}>{children}</PlacesContext>;
}

export function usePlaces() {
  const index = use(PlacesContext);
  if (!index) throw new Error("usePlaces must be used inside <PlacesProvider>");
  return index;
}
