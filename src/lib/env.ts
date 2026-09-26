import { z } from "zod";

/**
 * Every environment variable the app reads, validated once at startup.
 * Import `env` instead of touching `process.env` anywhere else.
 * Add a variable: declare it here (and in `.env.example`).
 */

// Outside Next (drizzle-kit, scripts) nothing loads `.env` for us.
if (!process.env.NEXT_RUNTIME) {
  try {
    process.loadEnvFile();
  } catch {}
}

// `KEY=` in `.env` arrives as "" — treat it as not set.
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

const postgresUrl = z.url({
  protocol: /^postgres(ql)?$/,
  error: "must be a postgres:// connection URL",
});

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Database
  DATABASE_URL: postgresUrl,
  DIRECT_URL: optional(postgresUrl),
  DATABASE_POOL_MAX: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().int().positive().default(1),
  ),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;
