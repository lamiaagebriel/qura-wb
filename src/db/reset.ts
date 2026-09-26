/**
 * DANGER: wipes the database and rebuilds it from the Drizzle migrations.
 * `pnpm db:reset` — drops every table, enum and row in `public`, plus the
 * migration history, recreates `public`, then `db:migrate` runs.
 * Asks you to type the database name before doing anything.
 */
import { createInterface } from "node:readline/promises";

import postgres from "postgres";

import { env } from "../lib/env";

const url = env.DIRECT_URL ?? env.DATABASE_URL;
const { host, pathname } = new URL(url);
const database = pathname.slice(1);

async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  console.log(`\nThis will DELETE ALL DATA in "${database}" on ${host}.`);
  const answer = await rl.question(`Type the database name (${database}) to confirm: `);
  rl.close();

  if (answer.trim() !== database) {
    console.log("Cancelled — nothing was changed.");
    process.exitCode = 1;
    return;
  }

  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  try {
    await sql.begin(async (tx) => {
      await tx`drop schema if exists drizzle cascade`;
      await tx`drop schema if exists public cascade`;
      await tx`create schema public`;
      // Default grants (Postgres + Supabase roles, when they exist).
      await tx`grant all on schema public to postgres, public`;
      await tx.unsafe(`
        do $$
        declare r text;
        begin
          foreach r in array array['anon', 'authenticated', 'service_role'] loop
            if exists (select 1 from pg_roles where rolname = r) then
              execute format('grant usage on schema public to %I', r);
              execute format('alter default privileges in schema public grant all on tables to %I', r);
              execute format('alter default privileges in schema public grant all on sequences to %I', r);
              execute format('alter default privileges in schema public grant all on functions to %I', r);
            end if;
          end loop;
        end $$;
      `);
    });
    console.log("Database wiped. Running migrations…");
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
