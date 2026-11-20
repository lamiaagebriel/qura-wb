import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import type { TestProject } from "vitest/node";

/**
 * A clean `qura_test` database from the real migrations (triggers, rules,
 * starting places), once per run. Needs the local Postgres:
 * `docker compose up -d`.
 */
export default async function setup(project: TestProject) {
  // The one in vitest.config.mts (`test.env`).
  const databaseUrl = project.config.env.DATABASE_URL as string;
  const url = new URL(databaseUrl);
  // Only ever the local test database.
  if (url.hostname !== "localhost" || url.pathname !== "/qura_test") {
    throw new Error(`Tests only run against localhost/qura_test, not ${url.host}${url.pathname}`);
  }

  const server = postgres({ ...connection(url), database: "postgres", max: 1, onnotice: () => {} });
  try {
    await server`drop database if exists qura_test with (force)`;
    await server`create database qura_test`;
  } catch (error) {
    throw new Error(`Can't reach the test database. Start it with \`docker compose up -d\`.\n${error}`);
  } finally {
    await server.end();
  }

  const client = postgres(databaseUrl, { max: 1, onnotice: () => {} });
  await migrate(drizzle(client), { migrationsFolder: "./src/db/migrations" });
  await client.end();
}

const connection = (url: URL) => ({
  host: url.hostname,
  port: Number(url.port),
  username: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
});
