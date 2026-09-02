import { BUSINESS_CATEGORIES, type BusinessCategory } from "@/db/schema";

/**
 * The one dedicated bridge between Google's place-type vocabulary and
 * Qura's own category taxonomy (`BUSINESS_CATEGORIES`) — every rule in
 * this file's design is deliberate, not incidental:
 *
 * - Google `types` are SIGNALS, never authority. This module never
 *   writes to `business_blocks.category` (it doesn't touch the database
 *   at all — it's a pure function), and nothing calling it should either.
 *   A business's actual Qura category remains whatever its owner set,
 *   full stop.
 * - One Google place can legitimately map to SEVERAL Qura categories
 *   (e.g. a place typed both `hospital` and `pharmacy` reasonably
 *   suggests both `health`-category signals) — the mapping table below
 *   is `type -> BusinessCategory[]`, and the result of mapping several
 *   types is simply the UNION of every category any of them signals.
 *   There is no "pick one winner" step and no conflict to resolve:
 *   several simultaneous candidate categories is the correct, expected
 *   output, not an error state.
 * - An unrecognized/new Google type produces NO signal — it's silently
 *   skipped, never guessed at via partial string matching or fuzzy
 *   logic. Expanding coverage means adding an explicit entry below, not
 *   writing a heuristic.
 * - This module has no awareness of search, ranking, or filtering —
 *   deliberately. It only ever answers "which Qura categories could
 *   these Google types reasonably signal," nothing about how (or
 *   whether) a caller uses that for discovery. That's later work.
 * - Works identically for a Google-only search result's `types` and for
 *   a Qura-connected business's `GooglePlaceDetails.types` — both are
 *   just `string[]` to this function, no special-casing either path.
 * - Costs nothing extra in Google API terms: `types` is already part of
 *   both `search.ts`'s and `details.ts`'s existing field masks (Phase 3/
 *   4), never fetched specifically for this.
 */

// Deliberately a maintainable STARTING subset of Google's full place-type
// vocabulary (Google publishes ~200), not an attempt at exhaustive
// coverage — every entry here was chosen because it's an unambiguous,
// confident signal for that Qura category. Extend by adding entries, not
// by loosening the matching logic. A Google type is free to appear more
// than once across different categories (see `hospital` below, under
// both `health` and `emergency`) — that's the intended way multiple
// simultaneous signals get expressed.
const GOOGLE_TYPE_TO_QURA_CATEGORIES: Record<string, BusinessCategory[]> = {
  // food-drinks
  restaurant: ["food-drinks"],
  cafe: ["food-drinks"],
  coffee_shop: ["food-drinks"],
  bakery: ["food-drinks"],
  bar: ["food-drinks"],
  meal_takeaway: ["food-drinks"],
  meal_delivery: ["food-drinks"],
  fast_food_restaurant: ["food-drinks"],
  pizza_restaurant: ["food-drinks"],

  // health
  hospital: ["health", "emergency"],
  doctor: ["health"],
  dentist: ["health"],
  pharmacy: ["health"],
  drugstore: ["health"],
  physiotherapist: ["health"],
  medical_lab: ["health"],

  // beauty
  beauty_salon: ["beauty"],
  hair_salon: ["beauty"],
  hair_care: ["beauty"],
  nail_salon: ["beauty"],
  spa: ["beauty", "lifestyle"],

  // creative
  art_gallery: ["creative"],

  // shopping
  shopping_mall: ["shopping"],
  clothing_store: ["shopping"],
  department_store: ["shopping"],
  supermarket: ["shopping"],
  convenience_store: ["shopping"],
  electronics_store: ["shopping"],
  furniture_store: ["shopping"],
  jewelry_store: ["shopping"],
  shoe_store: ["shopping"],
  book_store: ["shopping"],
  pet_store: ["shopping"],
  florist: ["shopping"],
  gift_shop: ["shopping"],

  // home-services
  electrician: ["home-services"],
  plumber: ["home-services"],
  locksmith: ["home-services"],
  painter: ["home-services"],
  roofing_contractor: ["home-services"],
  general_contractor: ["home-services"],
  moving_company: ["home-services"],
  laundry: ["home-services"],

  // automotive
  car_repair: ["automotive"],
  car_dealer: ["automotive"],
  car_rental: ["automotive"],
  car_wash: ["automotive"],
  gas_station: ["automotive"],

  // education
  school: ["education"],
  primary_school: ["education"],
  secondary_school: ["education"],
  university: ["education"],
  library: ["education"],

  // tourism
  tourist_attraction: ["tourism"],
  lodging: ["tourism"],
  hotel: ["tourism"],
  travel_agency: ["tourism"],
  museum: ["tourism"],
  amusement_park: ["tourism"],
  zoo: ["tourism"],

  // professional-services
  lawyer: ["professional-services"],
  accounting: ["professional-services"],
  insurance_agency: ["professional-services"],
  consultant: ["professional-services"],

  // real-estate
  real_estate_agency: ["real-estate"],

  // jobs
  employment_agency: ["jobs"],

  // community
  community_center: ["community"],

  // events
  event_venue: ["events"],
  banquet_hall: ["events"],

  // government
  local_government_office: ["government"],
  city_hall: ["government"],
  courthouse: ["government"],
  post_office: ["government"],
  embassy: ["government"],

  // emergency
  police: ["emergency"],
  fire_station: ["emergency"],

  // lifestyle
  night_club: ["lifestyle"],
  gym: ["lifestyle"],
  park: ["lifestyle"],
  movie_theater: ["lifestyle"],
};

/**
 * Maps a Google place's `types` to every Qura category they reasonably
 * signal — the union across all recognized input types, deduplicated,
 * with an unrecognized type simply contributing nothing (never guessed).
 *
 * The return order is deterministic and independent of the input order
 * or of Google's own type ordering: it always follows
 * `BUSINESS_CATEGORIES`' own declared order, so the same set of types
 * always produces the exact same output regardless of how Google happened
 * to order them in a given response.
 *
 * Pure — no database access, no Google API call, no side effects. Safe
 * to call for a Google-only search result or a Qura-connected business
 * alike, and safe to call repeatedly (e.g. once per search result)
 * without any cost beyond a plain object lookup.
 */
export function mapGoogleTypesToQuraCategories(
  types: readonly string[],
): BusinessCategory[] {
  const matched = new Set<BusinessCategory>();

  for (const type of types) {
    const categories = GOOGLE_TYPE_TO_QURA_CATEGORIES[type];
    if (!categories) continue;
    for (const category of categories) matched.add(category);
  }

  return BUSINESS_CATEGORIES.filter((category) => matched.has(category));
}
