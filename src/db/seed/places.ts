// The places migration 0010_places.sql creates (production has them too) —
// for the seed's sample data, which is built before touching the database.

import { placeIndex, type Place } from "@/lib/places";

const place = (
  slug: string,
  parent: string | null,
  lat: number,
  lng: number,
): Place => ({
  id: slug,
  slug,
  parentId: parent,
  typeId: "",
  name: { en: slug },
  center: { lat, lng },
});

export const SEED_PLACES = placeIndex([
  place("aswan", null, 24.0889, 32.8998),
  place("kom-ombo", "aswan", 24.4769, 32.9468),
  place("edfu", "aswan", 24.9781, 32.8734),
  place("daraw", "aswan", 24.4003, 32.9306),
  place("abu-simbel", "aswan", 22.3372, 31.6258),
  place("luxor", null, 25.6872, 32.6396),
  place("qena", null, 26.1551, 32.716),
]);
