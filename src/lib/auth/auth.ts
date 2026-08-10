import "server-only";

import { eq } from "drizzle-orm";

import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db, schema } from "@/db";
import { getLocaleFromCookieHeader } from "@/lib/i18n/config";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/lib/email/auth-emails";

import { hashPassword, verifyPasswordHash } from "./password";
import { generateUniqueUsername } from "./utils";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not set. Add it to your .env file.");
}

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days
const SESSION_RENEW_THRESHOLD_SECONDS = 60 * 60 * 24 * 15; // renew once <15 days left

/**
 * Single Better Auth instance, shared by the catch-all route
 * (`app/api/auth/[...all]/route.ts`) and every server action/guard that
 * calls `auth.api.*` directly. `role` and `status` are ours — declared
 * below via `user.additionalFields` — everything else is Better Auth's own
 * shape, mapped onto our existing table names via `database.schema`.
 */
export const auth = betterAuth({
  baseURL: process.env.APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  // Better Auth only trusts `baseURL` by default — a request whose Origin
  // header is anything else (e.g. testing from a phone against
  // `http://192.168.x.x:3000` instead of `http://localhost:3000`) gets
  // rejected with "Invalid origin" before it ever reaches a route. Add
  // more via `TRUSTED_ORIGINS` (comma-separated) rather than hardcoding a
  // LAN IP here — it's only ever needed for local dev, never in prod.
  trustedOrigins: process.env.TRUSTED_ORIGINS?.split(",").map((o) => o.trim()),

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  // We generate our own uuids at the DB level (`defaultRandom()` on every
  // table, see `db/helpers.ts`) — this tells Better Auth not to generate
  // its own ids and just let Postgres fill them in on insert.
  advanced: {
    database: { generateId: false },
  },

  session: {
    expiresIn: SESSION_DURATION_SECONDS,
    updateAge: SESSION_DURATION_SECONDS - SESSION_RENEW_THRESHOLD_SECONDS,
  },

  user: {
    additionalFields: {
      role: { type: "string", input: false, defaultValue: "business_owner" },
      status: { type: "string", input: false, defaultValue: "pending" },
      lastVerificationEmailSentAt: {
        type: "date",
        input: false,
        required: false,
      },
      lastPasswordResetEmailSentAt: {
        type: "date",
        input: false,
        required: false,
      },
      // Profile/privacy/settings fields — all `input: false` because
      // nothing writes them through `auth.api.*`; they're generated here
      // (username, on create) or updated directly via Drizzle from this
      // app's own server actions (`lib/auth/actions/*`), same as `status`
      // above.
      username: { type: "string", input: false },
      bio: { type: "string", input: false, required: false },
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    password: {
      hash: hashPassword,
      verify: ({ hash, password }) => verifyPasswordHash(hash, password),
    },
    // Sessions start right after sign-up, verified or not — `getPostAuthRedirect`
    // (in `lib/auth/guard.ts`) is what actually routes an unverified user to
    // `/verify-email` instead of `/account`.
    requireEmailVerification: false,
    // `request` is a plain Fetch API `Request` here, not a Next.js one —
    // Better Auth's own runtime, not our app, calls this — so the locale
    // has to come from the raw `cookie` header rather than `next/headers`'
    // `cookies()`, which isn't available (or reliable) in this context.
    sendResetPassword: async ({ user, token }, request) => {
      const locale = getLocaleFromCookieHeader(request?.headers.get("cookie"));
      await sendPasswordResetEmail(user.email, user.name, token, locale);
    },
    resetPasswordTokenExpiresIn: 60 * 60, // 1h
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, token }, request) => {
      const locale = getLocaleFromCookieHeader(request?.headers.get("cookie"));
      await sendVerificationEmail(user.email, user.name, token, locale);
    },
    sendOnSignUp: true,
    expiresIn: 60 * 60 * 24, // 24h
  },

  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },

  databaseHooks: {
    user: {
      create: {
        // New user, any path (email/password or social): pin down `role`
        // and derive `status` from whether the provider already verified
        // the email (Google always does; email/password never does yet).
        // `username` is generated here too — every account needs one from
        // creation on, and this is the one path both sign-up methods share.
        before: async (user) => ({
          data: {
            ...user,
            role: "business_owner",
            status: user.emailVerified ? "active" : "pending",
            username: await generateUniqueUsername(user.name),
          },
        }),
      },
      update: {
        // Fires after *any* update Better Auth makes to a user — in
        // practice the one we care about is `auth.api.verifyEmail`
        // flipping `emailVerified` to true. `status` is ours, so we move
        // it out of "pending" ourselves; never touches an already-active
        // or suspended account (a stale-but-unconsumed token can't
        // reactivate one). Our own `db.update(schema.users)` calls
        // elsewhere (cooldown timestamps, etc.) go straight through
        // Drizzle, not this adapter, so they never re-trigger this hook.
        after: async (user) => {
          const status = (user as { status?: string }).status;
          if (user.emailVerified && status === "pending") {
            await db
              .update(schema.users)
              .set({ status: "active" })
              .where(eq(schema.users.id, user.id));
          }
        },
      },
    },
    session: {
      create: {
        // Fast-fail a suspended account right at session creation — covers
        // sign-in, sign-up, and the OAuth callback all at once. A session
        // that was already valid when an account *later* gets suspended is
        // handled separately, in `getGuardedUser()` (`lib/auth/guard.ts`).
        before: async (session) => {
          const user = await db.query.users.findFirst({
            where: eq(schema.users.id, session.userId),
          });
          if (user?.status === "suspended") {
            throw new APIError("FORBIDDEN", {
              message:
                "Your account has been suspended. Contact support for help.",
            });
          }
          return { data: session };
        },
      },
    },
  },

  plugins: [nextCookies()], // must stay last — see Better Auth's Next.js docs
});
