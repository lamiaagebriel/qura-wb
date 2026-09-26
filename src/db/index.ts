import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";

import * as schema from "./schema";

/**
 * One connection pool per server instance.
 * - `max`: 1 suits serverless (each instance holds its own pool); raise
 *   `DATABASE_POOL_MAX` on a long-lived server.
 * - `prepare: false`: required behind transaction-mode poolers (Supabase
 *   :6543), harmless on a direct connection.
 * - Cached on `globalThis` in dev so hot reloads don't leak connections.
 */
const globalForDb = globalThis as { pg?: postgres.Sql };

const client =
  globalForDb.pg ??
  postgres(env.DATABASE_URL, {
    max: env.DATABASE_POOL_MAX,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

if (env.NODE_ENV !== "production") globalForDb.pg = client;

// `casing` maps camelCase keys to snake_case columns — no names to repeat.
export const db = drizzle(client, { schema, casing: "snake_case" });

export type DB = typeof db;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
