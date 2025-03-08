import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  out: "./src/servers/db/migrates",
  schema: "./src/servers/db/schema",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
