import "server-only";

import { GooglePlacesError } from "./errors";

// Places API (New) — Google's current, non-deprecated Places surface.
// Every endpoint this module calls lives under this one base.
const PLACES_API_BASE = "https://places.googleapis.com/v1";

// No existing repo-wide HTTP timeout convention was found (no other
// external HTTP call in this codebase — S3/SMTP go through their own
// SDKs, not `fetch`), so this is a plain `AbortController` timeout, kept
// generous enough for a live Places API round trip without letting a
// stalled request hang a Qura request indefinitely.
const REQUEST_TIMEOUT_MS = 8000;

function readApiKey(): string | null {
  return process.env.GOOGLE_PLACES_API_KEY || null;
}

/** Same shape as `lib/storage/s3.ts`'s `isStorageConfigured` — every
 * entry point that might call Google should be able to check this first
 * and degrade instead of throwing, so the rest of the app keeps working
 * with no `GOOGLE_PLACES_API_KEY` set (local dev, CI, a deploy where the
 * integration is intentionally off). */
export function isGooglePlacesConfigured(): boolean {
  return readApiKey() !== null;
}

type GooglePlacesRequest = {
  path: string;
  method: "GET" | "POST";
  // Required on every call, deliberately — see `search.ts`/`details.ts`
  // for why each field mask only asks for what that specific caller
  // needs (Places API billing is field-mask-sensitive).
  fieldMask: string;
  body?: unknown;
  searchParams?: Record<string, string>;
};

/**
 * The one place an HTTP request to Google actually gets built and sent.
 * Authenticates, applies the field mask, enforces the timeout, and maps
 * every failure mode (missing config, HTTP status, network error,
 * malformed JSON) onto `GooglePlacesError` — nothing above this function
 * ever sees a raw `Response`, a Google error body, or a thrown
 * `TypeError`/`DOMException` from `fetch` itself.
 *
 * No Qura logic here — no business/claim awareness, no database access,
 * no ranking/dedup. `search.ts` and `details.ts` are the only callers,
 * and both only ever add request shape + response normalization on top.
 */
export async function googlePlacesRequest<T>({
  path,
  method,
  fieldMask,
  body,
  searchParams,
}: GooglePlacesRequest): Promise<T> {
  const apiKey = readApiKey();
  if (!apiKey) {
    throw new GooglePlacesError(
      "GOOGLE_PLACES_NOT_CONFIGURED",
      "Google Places isn't configured — set GOOGLE_PLACES_API_KEY.",
    );
  }

  const url = new URL(`${PLACES_API_BASE}${path}`);
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        // Header auth, not `?key=` — keeps the key out of URLs that might
        // end up in server access logs.
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new GooglePlacesError(
        "GOOGLE_PLACES_TIMEOUT",
        `Google Places request to ${path} timed out after ${REQUEST_TIMEOUT_MS}ms.`,
      );
    }
    throw new GooglePlacesError(
      "GOOGLE_PLACES_UNAVAILABLE",
      `Couldn't reach Google Places (${path}).`,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw mapHttpError(response, path);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new GooglePlacesError(
      "GOOGLE_PLACES_INVALID_RESPONSE",
      `Google Places (${path}) returned a response that wasn't valid JSON.`,
    );
  }
}

function mapHttpError(response: Response, path: string): GooglePlacesError {
  // Server-side only, and deliberately just the status + path — never the
  // response body, which could echo back request details (or, in an
  // auth-error case, hint at the key) that don't belong in logs.
  console.error(
    `[google-places] request to ${path} failed with status ${response.status}`,
  );

  if (response.status === 401 || response.status === 403) {
    return new GooglePlacesError(
      "GOOGLE_PLACES_UNAUTHORIZED",
      `Google Places rejected the request credentials (${response.status}).`,
    );
  }
  if (response.status === 404) {
    return new GooglePlacesError(
      "GOOGLE_PLACE_NOT_FOUND",
      `Google Places found nothing at ${path}.`,
    );
  }
  if (response.status === 429) {
    return new GooglePlacesError(
      "GOOGLE_PLACES_QUOTA_EXCEEDED",
      "Google Places quota/rate limit exceeded.",
    );
  }
  if (response.status >= 500) {
    return new GooglePlacesError(
      "GOOGLE_PLACES_UNAVAILABLE",
      `Google Places server error (${response.status}).`,
    );
  }
  return new GooglePlacesError(
    "GOOGLE_PLACES_INVALID_REQUEST",
    `Google Places rejected the request (${response.status}).`,
  );
}
