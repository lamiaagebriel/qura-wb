/**
 * Phase 22 — an opt-in, dev-only stub for the Google Places HTTP boundary,
 * so the real running Next.js app (real browser, real cookies, real
 * request scope) can be driven through a browser-automation E2E test
 * without ever calling the real Google API. Mirrors exactly what
 * `evaluate-discovery.ts`/`evaluate-unified-search.ts` already do by
 * stubbing `globalThis.fetch` before the app code that calls it runs —
 * just wired through Next's `instrumentation.ts` hook (the one place code
 * can run once at server boot) instead of a standalone script's top level.
 *
 * Completely inert unless `E2E_STUB_GOOGLE=1` is set — a normal `next dev`
 * or `next start` never touches this file's behavior. Never runs in the
 * `edge` runtime (the app has no edge routes calling Google).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.E2E_STUB_GOOGLE !== "1") return;

  const realFetch = globalThis.fetch;

  function googlePlace(id: string, name: string, types: string[]) {
    return {
      id,
      displayName: { text: name },
      formattedAddress: `${name} address`,
      location: { latitude: 24.0889, longitude: 32.8998 },
      types,
    };
  }

  // `E2E_GOOGLE_PLACES` is a JSON array of `{id, name, types}` a test can
  // set per-run (via the `webServer.env` Playwright passes at server
  // startup) to control exactly what Text Search returns — read once at
  // register() time since this whole stub only exists for one fixed test
  // run's server process.
  let places: ReturnType<typeof googlePlace>[] = [];
  try {
    const raw = process.env.E2E_GOOGLE_PLACES;
    if (raw) {
      const parsed = JSON.parse(raw) as { id: string; name: string; types: string[] }[];
      places = parsed.map((p) => googlePlace(p.id, p.name, p.types));
    }
  } catch {
    places = [];
  }

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);

    if (!url.startsWith("https://places.googleapis.com/")) {
      return realFetch(input as never, init);
    }

    if (url.includes(":searchText")) {
      return new Response(JSON.stringify({ places, nextPageToken: undefined }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Details endpoint — /places/{placeId}. Not exercised by the
    // conversion flow itself (it never calls Details), but kept
    // functional so a profile page rendering an *already-connected*
    // business's Google info during the same test run degrades the same
    // documented way (fresh/stale/unavailable) rather than throwing.
    const placeId = decodeURIComponent(url.split("/places/")[1]?.split("?")[0] ?? "");
    const match = places.find((p) => p.id === placeId);
    if (!match) {
      return new Response(JSON.stringify({}), { status: 404 });
    }
    return new Response(JSON.stringify(match), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}
