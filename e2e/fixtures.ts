/**
 * Phase 22 — tiny shared derivation so `playwright.config.ts` (which
 * builds the stubbed Google Text Search response) and the spec files
 * (which query/clean up the real database) agree on exactly the same
 * fixture ids without duplicating literals. `E2E_RUN_ID` is generated
 * once per test run by the shell command that invokes `playwright test`
 * and inherited by both the config-evaluation process and every worker.
 */
// Generated once, the first time this module is evaluated in a given
// process — `playwright.config.ts` and every spec file share the same
// value because both live inside the same `playwright test` process
// tree and Node module caching returns the same cached export to each
// importer, not because it's threaded through an env var a caller has
// to remember to set.
const GENERATED_RUN_ID = `e2e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function runId(): string {
  return process.env.E2E_RUN_ID || GENERATED_RUN_ID;
}

export type StubPlace = { id: string; name: string; types: string[] };

export function stubPlaces(run: string): StubPlace[] {
  return [
    { id: `${run}_place_happy`, name: `${run} Happy Cafe`, types: ["cafe"] },
    { id: `${run}_place_cancel`, name: `${run} Cancel Cafe`, types: ["cafe"] },
    { id: `${run}_place_validate`, name: `${run} Validate Cafe`, types: ["cafe"] },
    { id: `${run}_place_category`, name: `${run} Category Cafe`, types: ["cafe"] },
    { id: `${run}_place_create`, name: `${run} Create Cafe`, types: ["cafe"] },
  ];
}
