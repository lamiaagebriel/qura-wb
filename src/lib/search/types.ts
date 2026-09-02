/**
 * A Qura business as it participates in unified search — a deliberately
 * narrow projection of `users` + `business_blocks`, not the full row of
 * either. In particular, no `email`/`role`/`status`/`ownerId` — those
 * exist on `users` but a search result is serialized straight to the
 * client, and the pre-Phase-4 `searchUsersAction` was already
 * accidentally shipping all of them (see the Phase 4 report). Fixed here
 * rather than carried forward.
 */
export type QuraBusinessSummary = {
  id: string;
  username: string;
  name: string;
  image: string | null;
  bio: string | null;
  category: string | null;
  city: string | null;
  // Phase 24: every Google Place this business is connected to (possibly
  // several branches), not a single nullable id — `[]` means unconnected.
  googlePlaceIds: string[];
};

export type UnifiedSearchResultSource = "qura" | "google" | "both";

/**
 * One row in a unified search result list. `source` is the one thing the
 * frontend should ever need to branch on — never infer it from whether
 * `quraBusinesses`/`googlePlace` happen to be non-empty/non-null, even
 * though in practice they always agree (a discriminated union, not
 * independent booleans, exactly so an invalid combination can't be
 * represented).
 *
 * `quraBusinesses` is a Phase 5 correction: many Qura businesses may
 * share one Google Place connection (see `business-google-places.ts`),
 * so one Google place can no longer be assumed to resolve to a single
 * Qura business. This is an array — possibly empty (`"google"`), possibly
 * more than one (`"both"`, several connected businesses) — never a single
 * arbitrarily-chosen business the way pre-Phase-5 code assumed.
 *
 * `id` is this result's identity for `useInfiniteList`'s `{id: string}`
 * requirement — see `merge.ts` for exactly how it's built. It is NOT a
 * database id and NOT a Google place id on its own; never pass it to a
 * query expecting either.
 */
export type UnifiedSearchResult = {
  id: string;
  source: UnifiedSearchResultSource;
  name: string;
  // Present whenever this result is connected on the Qura side (at least
  // one business has this place among its `business_google_places`
  // connections), independent of whether `googlePlace` below happens to
  // be populated this page — see `merge.ts`'s comment on why those two
  // are allowed to disagree. This is the one place id THIS result is
  // anchored on — a `quraBusinesses[]` entry may have other, unrelated
  // connections not represented here (Phase 24).
  googlePlaceId: string | null;
  quraBusinesses: Array<{
    id: string;
    username: string;
    image: string | null;
    bio: string | null;
    category: string | null;
    city: string | null;
  }>;
  // Only populated when Google's own search actually returned this place
  // in the current page (never fetched via Place Details just to fill
  // this in — see Phase 3/4's "no Details call per search result" rule).
  // A connected business can legitimately have `googlePlaceId` set but
  // `googlePlace: null` here.
  googlePlace: {
    placeId: string;
    name: string;
    address: string | null;
    location: { latitude: number; longitude: number } | null;
    types: string[];
  } | null;
};

/**
 * Opaque to the frontend — `useInfiniteList` only ever stores whatever
 * `nextCursor` it was handed and passes it back verbatim, never reads a
 * field off it.
 *
 * - `quraOffset`/`quraExhausted`: same offset pagination
 *   `searchUsersAction` always used, now source-scoped.
 * - `googlePageToken`/`googleExhausted`: Google's own continuation token,
 *   threaded straight through (never inspected here).
 * - `mergedBusinessIds`: every Qura business id already shown on an
 *   earlier page via a Google-side match. Without this, a business whose
 *   Google place surfaced early (page 1) but whose name/username sorts
 *   late (page 3, by the independent Qura `username asc` order) could
 *   reappear as a second, "qura"-only result once its own offset page
 *   comes around.
 * - `mergedPlaceIds`: every Google place id already shown as a group on
 *   an earlier page (Phase 5 addition, needed once one place can group
 *   several businesses) — without this, a NEW business connecting to an
 *   already-shown place mid-session could cause that whole group to
 *   reappear as a second row instead of being folded in or reasonably
 *   omitted. See `merge.ts`'s comment for the documented tradeoff this
 *   still leaves (a business that joins an already-shown place appears
 *   standalone, labeled `"qura"`, rather than retroactively rejoining a
 *   group already rendered on an earlier page).
 */
export type UnifiedSearchCursor = {
  quraOffset: number;
  quraExhausted: boolean;
  googlePageToken: string | null;
  googleExhausted: boolean;
  mergedBusinessIds: string[];
  mergedPlaceIds: string[];
};

export const INITIAL_SEARCH_CURSOR: UnifiedSearchCursor = {
  quraOffset: 0,
  quraExhausted: false,
  googlePageToken: null,
  googleExhausted: false,
  mergedBusinessIds: [],
  mergedPlaceIds: [],
};
