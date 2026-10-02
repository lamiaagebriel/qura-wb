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

  // App & auth
  APP_URL: z.url().transform((url) => url.replace(/\/+$/, "")),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "must be at least 32 characters (openssl rand -base64 32)"),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  // Maps JavaScript API (browser key, referrer-restricted): the pin picker.
  GOOGLE_MAPS_API_KEY: optional(z.string().min(1)),
  TRUSTED_ORIGINS: optional(
    z
      .string()
      .transform((v) => v.split(",").map((o) => o.trim()).filter(Boolean)),
  ),
});

// Production: real users, real cookies — HTTPS only (localhost is allowed so
// a production build can be tested locally: `pnpm start`).
const checked = schema.superRefine((env, ctx) => {
  if (env.NODE_ENV !== "production") return;
  const { protocol, hostname } = new URL(env.APP_URL);
  if (protocol !== "https:" && hostname !== "localhost")
    ctx.addIssue({
      code: "custom",
      path: ["APP_URL"],
      message: "must be https:// in production",
    });
});

const parsed = checked.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;
