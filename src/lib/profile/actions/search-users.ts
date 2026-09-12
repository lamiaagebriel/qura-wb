"use server";

import type { BusinessCategory } from "@/db/schema";
import { getActiveCity } from "@/lib/city/actions";
import { searchUnified, type MapArea } from "@/lib/search/unified-search";
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
 * `ownerId IS NOT NULL` rows.
 *
 * `category`, when given, is a business whose declared category matches
 * — never a replacement for the text match, a widening of it: a result
 * shows up if it matches the text OR the category, same "union, not
 * intersection" logic as the rest of `searchUnified`'s OR-based
 * matching. This is what lets a category chip on the search page just
 * set the query text to that category's name and run the exact same
 * search, rather than navigating to a separate category browse page —
 * businesses that mention the category in passing (text match) and
 * businesses actually filed under it (category match) both come back
 * together.
 *
 * `area`, when given, is an explicit map viewport ("Search this area" on
 * the map, after the user pans/zooms away from the city-wide view) — it
 * REPLACES the city-wide scoping for Google's side of the search with
 * that viewport instead of narrowing further; see `MapArea`'s own doc
 * comment for why Qura's own businesses aren't affected by it. */
export async function searchUsersAction(
  query: string,
  cursor: UnifiedSearchCursor | null = null,
  category?: BusinessCategory,
  area?: MapArea,
): Promise<{ items: UnifiedSearchResult[]; nextCursor: UnifiedSearchCursor | null }> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { items: [], nextCursor: null };

  const city = await getActiveCity();
  return searchUnified({
    query: trimmed,
    cursor: cursor ?? INITIAL_SEARCH_CURSOR,
    city,
    category,
    area,
  });
}
