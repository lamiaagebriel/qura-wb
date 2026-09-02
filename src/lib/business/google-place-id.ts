const GOOGLE_PLACE_ID_MAX_LENGTH = 255;

/**
 * The one shared "does this look like a real Google place id" guard —
 * used by both the existing claim/connect flow (`actions/claim-google-place.ts`)
 * and the Google-only -> Qura conversion flow
 * (`google-place-conversion.ts`), rather than each defining its own.
 * Lives outside any `"use server"` file on purpose: `google-place-conversion.ts`
 * needs to import it from a plain script context (the Phase 21 test
 * harness), and importing a `"use server"` action file transitively pulls
 * in `lib/auth/guard.ts` -> `next/navigation`, which breaks under the
 * `--conditions=react-server` flag those harnesses run with.
 */
export function isPlausibleGooglePlaceId(value: string): boolean {
  return value.length > 0 && value.length <= GOOGLE_PLACE_ID_MAX_LENGTH;
}
