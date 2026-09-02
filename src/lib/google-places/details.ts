import "server-only";

import { googlePlacesRequest } from "./client";
import { GooglePlacesError } from "./errors";
import type { GooglePlaceDetails } from "./types";

// A separate, explicit field set from `search.ts` — Place Details is a
// deliberate, one-off call per place (a claim attempt, a profile view),
// not run per search result, so a broader mask here doesn't multiply into
// N calls the way it would if this ran once per search hit. Still
// deliberately excludes photos and review text/authors: this phase never
// stores or displays either, and Google's review content specifically
// carries its own attribution/display requirements that belong in a later
// phase that actually renders them, not this one.
const DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "types",
  "rating",
  "userRatingCount",
  "businessStatus",
  "internationalPhoneNumber",
  "websiteUri",
  "regularOpeningHours",
].join(",");

type GoogleDetailsResponse = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
};

/**
 * Place Details (New) — `GET /places/{placeId}`. Read-only: this never
 * writes to the Qura database (that's `claimGooglePlaceForBusiness`'s
 * job, in a separate module entirely — see the Phase 3 report for why
 * that separation is deliberate). Safe to call from a future claim flow
 * (to confirm a place id is real before connecting it), a business
 * profile (to show live Google info), or a search result's "view details"
 * step — none of those exist yet.
 *
 * `placeId` is treated as fully opaque — `encodeURIComponent` below is
 * just safe transport encoding for the URL path segment, the same as it
 * would be for any string; it doesn't inspect, parse, or reconstruct the
 * id itself.
 *
 * `languageCode` (Phase 6): lets a caller ask Google to localize whatever
 * it can localize on its own — most usefully `regularOpeningHours
 * .weekdayDescriptions`, which Google returns as ready-made strings, not
 * structured data Qura could otherwise localize itself without hardcoding
 * weekday names. Optional and untouched (Google's own default) when
 * omitted.
 */
export async function getGooglePlaceDetails(
  placeId: string,
  languageCode?: string,
): Promise<GooglePlaceDetails> {
  if (!placeId) {
    throw new GooglePlacesError(
      "GOOGLE_PLACE_NOT_FOUND",
      "No Google place id was given.",
    );
  }

  const response = await googlePlacesRequest<GoogleDetailsResponse>({
    path: `/places/${encodeURIComponent(placeId)}`,
    method: "GET",
    fieldMask: DETAILS_FIELD_MASK,
    searchParams: languageCode ? { languageCode } : undefined,
  });

  if (!response.id) {
    throw new GooglePlacesError(
      "GOOGLE_PLACES_INVALID_RESPONSE",
      `Google Places details for ${placeId} came back without an id.`,
    );
  }

  const { latitude, longitude } = response.location ?? {};

  return {
    placeId: response.id,
    name: response.displayName?.text ?? "",
    address: response.formattedAddress,
    location:
      latitude !== undefined && longitude !== undefined
        ? { latitude, longitude }
        : undefined,
    types: response.types ?? [],
    rating: response.rating,
    userRatingCount: response.userRatingCount,
    businessStatus: response.businessStatus,
    phoneNumber: response.internationalPhoneNumber,
    websiteUri: response.websiteUri,
    openingHours: response.regularOpeningHours
      ? {
          openNow: response.regularOpeningHours.openNow,
          weekdayDescriptions: response.regularOpeningHours.weekdayDescriptions,
        }
      : undefined,
  };
}
