import { readFileSync } from "fs";
import { defineConfig } from "@playwright/test";

import { runId, stubPlaces } from "./e2e/fixtures";

// So `pnpm e2e` (or plain `npx playwright test`) works standalone, with
// nothing extra to set by hand:
//
// - `DATABASE_URL` — spec files import `@/db` directly (the same real
//   Postgres connection every `evaluate-*.ts` harness uses), which needs
//   it; loaded here from `.env` the same way `tsx --env-file=.env`
//   already does for those harnesses, since Playwright's own runner has
//   no `.env` support of its own.
// - `NODE_OPTIONS=--conditions=react-server` — required to import `@/db`
//   at all (it starts with `import "server-only"`; see every
//   `evaluate-*.ts` harness's own file header for this exact
//   requirement). Set here, in the main process, rather than passed on
//   the command line — worker processes are spawned fresh and inherit
//   `process.env`, so this reaches them the same way `E2E_RUN_ID` below
//   does.
try {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
} catch {
  // No `.env` — leave whatever the shell already provided.
}
process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS ?? ""} --conditions=react-server`.trim();

// Computed once here (in the main process that evaluates this config)
// and pinned into the environment so every spawned worker process
// inherits the SAME id — a worker is a separate Node process that would
// otherwise generate its own value the first time it imports
// `fixtures.ts`, disagreeing with the fixture ids already baked into
// `E2E_GOOGLE_PLACES` below.
const RUN = runId();
process.env.E2E_RUN_ID = RUN;

/**
 * Phase 22 — narrowly scoped to this one verification phase, not a
 * general-purpose E2E setup for the whole app (no framework existed
 * before this). Boots a real `next dev` server with the Google boundary
 * stubbed (`src/instrumentation.ts`, gated behind `E2E_STUB_GOOGLE=1` —
 * inert otherwise) so the tests exercise real routing, real cookies, real
 * server actions, and a real Postgres database, with only the external
 * Google HTTP call replaced by canned data.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  // Turbopack dev's very first served request occasionally races
  // `src/instrumentation.ts`'s async `register()` (which installs the
  // Google fetch stub) — observed as the first test in a run finding no
  // search results even though the exact same search succeeds on every
  // later test. One retry is enough; it's a cold-start ordering quirk of
  // this narrowly-scoped E2E setup, not app or test flakiness.
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3211",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx next dev -p 3211",
    url: "http://localhost:3211",
    reuseExistingServer: false,
    timeout: 90_000,
    env: {
      E2E_STUB_GOOGLE: "1",
      GOOGLE_PLACES_API_KEY: "e2e-stub-key",
      E2E_GOOGLE_PLACES: JSON.stringify(stubPlaces(RUN)),
      // The test *process* runs with `--conditions=react-server` (needed
      // so spec files can import `@/db`, which is gated behind
      // `import "server-only"` — see the npm script this config is run
      // from). That env var is inherited by this spawned `next dev`
      // child unless cleared here — left in place, it breaks Next's own
      // dev server startup (Next isn't built to boot under that
      // condition itself).
      NODE_OPTIONS: "",
    },
  },
});
