import { createHmac, randomBytes } from "node:crypto";

import type { BrowserContext } from "@playwright/test";
import postgres from "postgres";

// Signing in for tests without Google: a test user and a session straight
// in the dev database, and Better Auth's signed session cookie (the same
// thing its `test-utils` plugin does). Uses DATABASE_URL and
// BETTER_AUTH_SECRET from `.env`.

export const EMAIL = "e2e@qura.test";
const USERNAME = "e2e_tester";
const NAME = "E2E Tester";
const DAY = 24 * 60 * 60 * 1000;

let sql: postgres.Sql | undefined;

export function db() {
  if (!sql) {
    try {
      process.loadEnvFile(".env");
    } catch {
      // No .env (CI): the variables come from the environment.
    }
    sql = postgres(process.env.DATABASE_URL!, { max: 1, onnotice: () => {} });
  }
  return sql;
}

// A second account for the admin dashboard, so the test user stays a
// regular one for the specs running beside it.
export const ADMIN_EMAIL = "e2e-admin@qura.test";
const ADMIN_USERNAME = "e2e_admin";
const ADMIN_NAME = "E2E Admin";

/**
 * Signs `context` in as the test user, or as the test super admin (`as:
 * "admin"`) — created on first use.
 */
export async function signIn(
  context: BrowserContext,
  baseURL: string,
  as: "user" | "admin" = "user",
) {
  const sql = db();
  const admin = as === "admin";
  const [user] = await sql<{ id: string }[]>`
    insert into users (name, email, email_verified, username, role)
    values (
      ${admin ? ADMIN_NAME : NAME},
      ${admin ? ADMIN_EMAIL : EMAIL},
      true,
      ${admin ? ADMIN_USERNAME : USERNAME},
      ${admin ? "super_admin" : "member"}
    )
    on conflict (email) do update set status = 'active', role = excluded.role
    returning id`;
  await sql`delete from sessions where user_id = ${user.id} and expires_at < now()`;

  const token = randomBytes(24).toString("base64url");
  await sql`
    insert into sessions (token, user_id, expires_at)
    values (${token}, ${user.id}, ${new Date(Date.now() + DAY)})`;

  const signature = createHmac("sha256", process.env.BETTER_AUTH_SECRET!)
    .update(token)
    .digest("base64");
  const value = encodeURIComponent(`${token}.${signature}`);
  // A production build uses secure cookies, named with `__Secure-` (the
  // browser accepts those on localhost too); dev uses the plain name.
  await context.addCookies(
    ["better-auth.session_token", "__Secure-better-auth.session_token"].map(
      (name) => ({
        name,
        value,
        // Domain + path, not `url`: an http:// url can't carry a secure cookie.
        domain: new URL(baseURL).hostname,
        path: "/",
        httpOnly: true,
        secure: name.startsWith("__Secure-"),
        sameSite: "Lax" as const,
      }),
    ),
  );
}
