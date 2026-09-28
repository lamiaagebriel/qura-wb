import { defineConfig } from "drizzle-kit";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is not set. Add it to your .env file.");
}

export default defineConfig({
  dialect: "postgresql",
  out: "./src/db/migrates",
  schema: "./src/db/schema",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
