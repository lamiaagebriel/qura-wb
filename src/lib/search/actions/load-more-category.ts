"use server";

import { isBusinessCategory } from "@/lib/categories";
import { getActiveCity } from "@/lib/city/actions";
import {
  getCategoryDiscovery,
  type CategoryDiscoveryCursor,
  type CategoryDiscoveryResult,
} from "@/lib/search/category-discovery";

/**
 * "Load more" for `/categories/[category]` — called directly from the
 * client's Load More button, never on scroll (Phase 12: explicit button,
 * not infinite scroll, so Google Text Search quota is only spent on a
 * deliberate click). The cursor is round-tripped exactly as
 * `getCategoryDiscovery` produced it; this action never inspects or
 * rebuilds it, and it never reaches the URL — it only ever lives in the
 * client component's state and this one server round trip.
 *
 * `city` is re-derived from the session's active-city cookie server-side,
 * never trusted from the client, same pattern as every other "load more"
 * action in `lib/threads/actions/load-more.ts`. An invalid/tampered
 * `category` degrades to an empty page rather than throwing — the same
 * "not found" treatment the page itself gives an invalid category.
 */
export async function loadMoreCategoryDiscoveryAction(
  category: string,
  cursor: CategoryDiscoveryCursor,
): Promise<{ items: CategoryDiscoveryResult[]; nextCursor: CategoryDiscoveryCursor | null }> {
  if (!isBusinessCategory(category)) return { items: [], nextCursor: null };

  const city = await getActiveCity();
  return getCategoryDiscovery({ category, city, cursor });
}
