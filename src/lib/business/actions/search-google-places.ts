"use server";

import { getGuardedUser } from "@/lib/auth/guard";
import { fail, messageError, ok, type ActionResult } from "@/lib/errors";
import { GooglePlacesError } from "@/lib/google-places/errors";
import { searchGooglePlaces } from "@/lib/google-places/search";
import type { GooglePlaceSearchResult } from "@/lib/google-places/types";
import { getLocale } from "@/lib/i18n/actions";

const RESULTS_LIMIT = 10;

/**
 * The browser-facing boundary onto Phase 3's Google Places client — the
 * only way `google-place-connection.tsx` (a client component) ever
 * reaches Google, since `GOOGLE_PLACES_API_KEY` can only be read from
 * server code (`lib/google-places/client.ts`). Auth-gated the same as
 * every other business action even though this one is read-only: it's
 * still spending Qura's Google API quota, not something an anonymous
 * visitor should be able to trigger freely.
 */
export async function searchGooglePlacesForConnectionAction(
  query: string,
): Promise<ActionResult<{ results: GooglePlaceSearchResult[] }>> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));

  const trimmed = query.trim();
  if (trimmed.length < 2) return ok({ results: [] });

  try {
    const { results } = await searchGooglePlaces({
      query: trimmed,
      regionCode: "EG",
      pageSize: RESULTS_LIMIT,
    });
    return ok({ results });
  } catch (error) {
    if (error instanceof GooglePlacesError) {
      console.warn(`[business] Google Places search failed (${error.code}).`);
      return fail(
        messageError(
          t("Couldn't search Google right now. Try again shortly."),
          "google_place_search_failed",
        ),
      );
    }
    throw error;
  }
}
