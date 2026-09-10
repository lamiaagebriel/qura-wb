/**
 * Qura's own stable representation of a Google place — nothing outside
 * `lib/google-places/` should ever touch Google's raw JSON response shape
 * (`displayName.text`, `location.latitude`/`longitude`, etc.); `search.ts`
 * and `details.ts` are the only two places that normalize into this.
 *
 * `placeId` is opaque everywhere it appears here — stored, compared, and
 * passed on exactly as Google returned it, never parsed or reconstructed
 * (see `details.ts`'s comment on why `encodeURIComponent` doesn't count as
 * parsing).
 */
export type GooglePlaceLocation = {
  latitude: number;
  longitude: number;
};

export type GooglePlaceSearchResult = {
  placeId: string;
  name: string;
  address?: string;
  location?: GooglePlaceLocation;
  types: string[];
};

export type GooglePlaceOpeningHours = {
  openNow?: boolean;
  weekdayDescriptions?: string[];
};

/**
 * One of up to 5 reviews Google's Place Details returns for a place —
 * always displayed live, exactly like every other `GooglePlaceDetails`
 * field, never copied into any Qura-owned table (see that type's own
 * comment). `authorPhotoUri` is the REVIEWER's own profile photo, not a
 * photo attached to the review itself — Google's Places API (New) has no
 * separate "review photo" field, so this is the only picture Google ever
 * gives you for a review.
 */
export type GooglePlaceReview = {
  rating: number;
  text?: string;
  authorName: string;
  authorPhotoUri?: string;
  // Google's own pre-localized "3 weeks ago" string — used as-is rather
  // than recomputed from `publishTime`, the same reasoning
  // `formatCompactRelativeTime` would otherwise duplicate.
  relativePublishTimeDescription: string;
  publishTime: string;
};

/**
 * A superset of `GooglePlaceSearchResult`'s fields plus whatever's only
 * worth the extra request cost when a caller actually wants one specific
 * place — see `details.ts`'s field mask for exactly what's requested.
 * Deliberately does NOT include photos: Google review PHOTOS specifically
 * aren't exposed by the Places API at all (see `GooglePlaceReview`'s own
 * comment) — but `reviews` themselves are fetched. Nothing here should
 * ever be copied into Qura's own tables — Google remains the source for
 * this data, Qura only ever displays it live.
 */
export type GooglePlaceDetails = {
  placeId: string;
  name: string;
  address?: string;
  location?: GooglePlaceLocation;
  types: string[];
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  phoneNumber?: string;
  websiteUri?: string;
  openingHours?: GooglePlaceOpeningHours;
  reviews?: GooglePlaceReview[];
};

export type SearchGooglePlacesInput = {
  query: string;
  // Both required together for location bias — mirrors
  // `lib/location.ts`'s existing `lat`/`lng` pairing rule. Supplying only
  // one is treated as supplying neither (see `search.ts`).
  latitude?: number;
  longitude?: number;
  // Only used when latitude/longitude are both present; defaults in
  // `search.ts` if omitted.
  radiusMeters?: number;
  languageCode?: string;
  regionCode?: string;
  // Candidate count for one page — kept caller-controlled rather than a
  // fixed internal constant, since Phase 4's unified search wants a
  // smaller number than Google's own max (20) — see
  // `lib/search/unified-search.ts`'s `GOOGLE_PAGE_SIZE`.
  pageSize?: number;
  // Opaque continuation token from a previous call's `nextPageToken` —
  // never inspected or constructed here, only passed through to Google.
  pageToken?: string;
};

/** `nextPageToken` is `null`, not omitted, once Google has no more pages
 * — callers can check it directly without an `in` check. */
export type SearchGooglePlacesResult = {
  results: GooglePlaceSearchResult[];
  nextPageToken: string | null;
};
