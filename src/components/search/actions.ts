"use server";

import {
  searchFakeBusinesses,
  type BusinessSummary,
} from "@/components/profile/fake-businesses";

/**
 * Businesses matching `query` by name, handle, category or description.
 * Actions are public endpoints: the argument is checked, not trusted.
 * TEMPORARY: searches the fake businesses until businesses are stored.
 */
export async function searchBusinesses(query: unknown): Promise<BusinessSummary[]> {
  if (typeof query !== "string") return [];
  return searchFakeBusinesses(query.slice(0, 100));
}
