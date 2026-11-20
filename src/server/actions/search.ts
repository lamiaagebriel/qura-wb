"use server";

import type { BusinessSummary } from "@/lib/business";
import { searchBusinesses as search } from "@/server/queries/businesses";

/**
 * Businesses matching `query` by name, handle, category or description.
 * Actions are public endpoints: the argument is checked, not trusted.
 */
export async function searchBusinesses(
  query: unknown,
): Promise<BusinessSummary[]> {
  if (typeof query !== "string") return [];
  return search(query.slice(0, 100));
}
