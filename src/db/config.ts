import { defineConfig } from "drizzle-kit";

import { env } from "../lib/env";

// Run from the project root (paths below are relative to it).
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema",
  out: "./src/db/migrations",
  // Migrations run DDL, which transaction-mode poolers (e.g. Supabase :6543)
  // don't handle well — use the direct connection when one is provided.
  dbCredentials: { url: env.DIRECT_URL ?? env.DATABASE_URL },
  casing: "snake_case",
  strict: true,
  verbose: true,
});
