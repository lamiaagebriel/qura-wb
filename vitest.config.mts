import path from "node:path";

import { defineConfig } from "vitest/config";

const root = path.resolve(import.meta.dirname, "src");

// The test database: the local Postgres from compose.yaml, its own
// `qura_test` database (rebuilt from the migrations on every run). Never the
// one in `.env`: src/test/global-setup.ts refuses anything else.
const TEST_DATABASE_URL = "postgres://postgres:postgres@localhost:5433/qura_test";

// Runs the real server actions and queries against a real Postgres; only the
// session (and Next's request-only APIs) are stood in (src/test/setup.ts).
export default defineConfig({
  resolve: {
    alias: [
      { find: "server-only", replacement: `${root}/test/empty.ts` },
      { find: "@", replacement: root },
    ],
  },
  test: {
    include: ["src/test/**/*.test.ts"],
    globalSetup: "src/test/global-setup.ts",
    setupFiles: ["src/test/setup.ts"],
    // One database: files run one after another.
    fileParallelism: false,
    testTimeout: 20_000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: TEST_DATABASE_URL,
      DIRECT_URL: "",
      DATABASE_POOL_MAX: "5",
      APP_URL: "http://localhost:3000",
      BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-00",
      GOOGLE_CLIENT_ID: "test",
      GOOGLE_CLIENT_SECRET: "test",
    },
  },
});
