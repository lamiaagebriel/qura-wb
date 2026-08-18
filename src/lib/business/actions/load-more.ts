"use server";

import { getBusinessReviews } from "@/lib/business/queries";

/** Called directly from the client as scroll reaches the sentinel
 * (`useInfiniteList`), same as every other paginated list's load-more
 * action — see `lib/threads/actions/load-more.ts`. No viewer needed
 * here, unlike those: a review list reads the same regardless of who's
 * looking at it. */
export async function loadMoreBusinessReviewsAction(
  businessId: string,
  cursor: number,
) {
  return getBusinessReviews(businessId, cursor);
}
