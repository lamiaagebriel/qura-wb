"use server";

import { and, or, ilike, isNotNull } from "drizzle-orm";

import { db, schema } from "@/db";

const SEARCH_RESULTS_PAGE_SIZE = 20;

/** Not a form-submit action (no `ActionResult` wrapper) — a plain read
 * called straight from the search page's client component, both for the
 * initial query and for "load more" as the user scrolls the results.
 * Fetches `pageSize + 1` rows to answer "is there another page?" without
 * a separate COUNT query, same pattern as the thread list queries.
 *
 * Business profiles only, not personal accounts — search is meant for
 * finding businesses to follow, not looking up other people. */
export async function searchUsersAction(query: string, cursor = 0) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { items: [], nextCursor: null };

  const pattern = `%${trimmed}%`;
  const rows = await db.query.users.findMany({
    where: and(
      isNotNull(schema.users.ownerId),
      or(ilike(schema.users.username, pattern), ilike(schema.users.name, pattern)),
    ),
    orderBy: (users, { asc }) => [asc(users.username)],
    limit: SEARCH_RESULTS_PAGE_SIZE + 1,
    offset: cursor,
  });

  const hasMore = rows.length > SEARCH_RESULTS_PAGE_SIZE;
  return {
    items: rows.slice(0, SEARCH_RESULTS_PAGE_SIZE),
    nextCursor: hasMore ? cursor + SEARCH_RESULTS_PAGE_SIZE : null,
  };
}
