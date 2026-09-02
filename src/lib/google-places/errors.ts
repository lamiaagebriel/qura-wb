import "server-only";

/**
 * Every failure mode this module can produce, normalized away from
 * whatever HTTP status/body Google actually sent — nothing downstream
 * (a server action, eventually a search result) should ever need to know
 * Google's status codes or error shape, only one of these.
 */
export type GooglePlacesErrorCode =
  | "GOOGLE_PLACES_NOT_CONFIGURED"
  | "GOOGLE_PLACES_UNAUTHORIZED"
  | "GOOGLE_PLACES_INVALID_REQUEST"
  | "GOOGLE_PLACES_QUOTA_EXCEEDED"
  | "GOOGLE_PLACE_NOT_FOUND"
  | "GOOGLE_PLACES_UNAVAILABLE"
  | "GOOGLE_PLACES_INVALID_RESPONSE"
  | "GOOGLE_PLACES_TIMEOUT";

/**
 * The only error type this module ever throws — `message` is a plain
 * English string meant for server logs, not for a user (callers that
 * surface something to a user should branch on `code` and show their own
 * translated copy, the same way `lib/errors.ts`'s `AppError.code` is used
 * elsewhere in this codebase). Never carries the raw Google response body,
 * headers, or the API key.
 */
export class GooglePlacesError extends Error {
  readonly code: GooglePlacesErrorCode;

  constructor(code: GooglePlacesErrorCode, message: string) {
    super(message);
    this.name = "GooglePlacesError";
    this.code = code;
  }
}
