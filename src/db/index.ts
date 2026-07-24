import * as orm from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

// NOTE: uses the `postgres` (postgres-js) driver — matches the
// `postgres` package in package.json. `drizzle-orm/node-postgres` (the
// `pg` driver) was wired here before but `pg` was never a dependency.

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to your .env file.");
}

/**
 * `max: 1` is the standard tuning for a serverless deployment (Vercel,
 * per this project's fixed stack): every function invocation can spin up
 * its own instance of this module, each holding its own connection pool.
 * postgres-js defaults to `max: 10` *per instance* — fine on a long-lived
 * server, but a handful of concurrent invocations at 10 connections each
 * exhausts Supabase's connection limit fast. One connection per instance,
 * held only briefly, is the safe default.
 *
 * IMPORTANT — this alone isn't enough in production: `DATABASE_URL`
 * should point at Supabase's connection *pooler* (Project Settings >
 * Database > Connection pooling, port 6543), not the direct connection
 * (port 5432). The pooler is what actually lets many short-lived
 * serverless invocations share a small number of real Postgres backends.
 * `prepare: false` is required alongside it — Supabase's pooler runs in
 * transaction mode by default, which doesn't support prepared statements
 * persisting across queries the way a direct connection does.
 */
const client = postgres(process.env.DATABASE_URL, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});

const db = drizzle(client, { schema });

export { db, schema, orm };
