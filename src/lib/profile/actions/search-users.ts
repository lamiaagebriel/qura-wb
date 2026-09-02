"use server";

import { getActiveCity } from "@/lib/city/actions";
import { searchUnified } from "@/lib/search/unified-search";
import { INITIAL_SEARCH_CURSOR } from "@/lib/search/types";
import type { UnifiedSearchCursor, UnifiedSearchResult } from "@/lib/search/types";

/** Not a form-submit action (no `ActionResult` wrapper) — a plain read
 * called straight from the search page's client component, both for the
 * initial query and for "load more" as the user scrolls the results.
 *
 * As of Phase 4 this is a thin transport boundary over
 * `lib/search/unified-search.ts` — the query-length guard is the only
 * thing still living here; everything about *how* Qura and Google get
 * searched, merged, and paginated lives in that module (and is testable
 * without this action, Next.js, or auth — see `lib/search/merge.ts`).
 * As of Phase 16, this is also where `getActiveCity()` (Next's
 * `cookies()`, request-scoped) is read — `searchUnified` itself takes
 * `city` as a plain parameter, so it can be called from a real request
 * (here) or an evaluation harness identically.
 *
 * Still business profiles-oriented, not personal accounts — same as
 * before Phase 4, `unifiedSearch`'s Qura side only ever matches
 * `ownerId IS NOT NULL` rows. */
export async function searchUsersAction(
  query: string,
  cursor: UnifiedSearchCursor | null = null,
): Promise<{ items: UnifiedSearchResult[]; nextCursor: UnifiedSearchCursor | null }> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { items: [], nextCursor: null };

  const city = await getActiveCity();
  return searchUnified({ query: trimmed, cursor: cursor ?? INITIAL_SEARCH_CURSOR, city });
}
