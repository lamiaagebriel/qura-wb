import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  out: "./src/db/migrates",
  schema: "./src/db/schema",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
