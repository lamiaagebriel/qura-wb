import "server-only";

import { googlePlacesRequest } from "./client";
import type {
  GooglePlaceSearchResult,
  SearchGooglePlacesInput,
  SearchGooglePlacesResult,
} from "./types";

// Only what the initial Qura search result list needs — `rating`/
// `userRatingCount`/photos are deliberately left out here even though
// Google supports them on this endpoint: Places API billing scales with
// the requested field mask, and nothing in the current (Phase 4) result
// list shows them. Add them here only when a real UI actually needs to
// render them, not preemptively. `nextPageToken` is a top-level response
// field, not nested under `places.*` — Google omits it too unless it's
// explicitly listed here, same field-mask-gates-everything rule as
// everything else on this API.
const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.types",
  "nextPageToken",
].join(",");

// Google's `locationBias` circle requires a radius alongside the center —
// this is only the default when a caller supplies coordinates but no
// radius, not a general "search near Aswan" assumption (no bias is applied
// at all unless the caller passes real coordinates — see below).
const DEFAULT_RADIUS_METERS = 5000;

type GoogleSearchTextResponsePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
};

type GoogleSearchTextResponse = {
  places?: GoogleSearchTextResponsePlace[];
  nextPageToken?: string;
};

function normalizeSearchResult(
  place: GoogleSearchTextResponsePlace & { id: string },
): GooglePlaceSearchResult {
  const { latitude, longitude } = place.location ?? {};
  return {
    placeId: place.id,
    name: place.displayName?.text ?? "",
    address: place.formattedAddress,
    location:
      latitude !== undefined && longitude !== undefined
        ? { latitude, longitude }
        : undefined,
    types: place.types ?? [],
  };
}

/**
 * Text Search (New) — `POST /places:searchText`. One request in, one
 * normalized page out; never fetches Details for any result on its own
 * (that's a separate, explicit call — see `details.ts` — so a single
 * search never silently becomes N+1 Google requests).
 *
 * No Qura concept leaks in here: no `cityEnum`, no active-city cookie, no
 * IP-based location guess. `latitude`/`longitude` are only ever what the
 * caller explicitly passes, and `pageToken` is only ever what a previous
 * call's `nextPageToken` was — this module doesn't resolve a user's
 * location or manage pagination state itself, that's
 * `lib/search/unified-search.ts`'s job (Phase 4).
 */
export async function searchGooglePlaces(
  input: SearchGooglePlacesInput,
): Promise<SearchGooglePlacesResult> {
  const body: Record<string, unknown> = { textQuery: input.query };

  if (input.languageCode) body.languageCode = input.languageCode;
  if (input.regionCode) body.regionCode = input.regionCode;
  if (input.pageSize) body.pageSize = input.pageSize;
  if (input.pageToken) body.pageToken = input.pageToken;

  // Both-or-neither, same rule `lib/location.ts` already enforces for
  // Qura's own stored locations — one coordinate without the other isn't
  // a usable bias, so it's silently dropped rather than sent malformed.
  if (input.latitude !== undefined && input.longitude !== undefined) {
    body.locationBias = {
      circle: {
        center: { latitude: input.latitude, longitude: input.longitude },
        radius: input.radiusMeters ?? DEFAULT_RADIUS_METERS,
      },
    };
  }

  const response = await googlePlacesRequest<GoogleSearchTextResponse>({
    path: "/places:searchText",
    method: "POST",
    fieldMask: SEARCH_FIELD_MASK,
    body,
  });

  const results = (response.places ?? [])
    .filter((place): place is GoogleSearchTextResponsePlace & { id: string } =>
      Boolean(place.id),
    )
    .map(normalizeSearchResult);

  return { results, nextPageToken: response.nextPageToken ?? null };
}
