import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  accounts,
  rateLimits,
  sessions,
  users,
  verifications,
} from "@/db/schema";
import { env } from "@/lib/env";

import { ensurePersonalProfile } from "./profile";
import { generateUniqueUsername } from "./username";

const DAY = 60 * 60 * 24;

// Every origin the app is served from: APP_URL plus TRUSTED_ORIGINS
// (LAN address, tunnel, preview domains...).
const origins = [env.APP_URL, ...(env.TRUSTED_ORIGINS ?? [])];

// Google rejects IP addresses as redirect URIs, so a LAN IP can't build its
// own auth URLs: it falls back to APP_URL (localhost). On the phone, swap
// `localhost` for the IP in the failed callback URL to finish signing in.
const isIpHost = (origin: string) =>
  /^[\d.]+$|^\[/.test(new URL(origin).hostname);
const authHosts = origins
  .filter((origin) => origin === env.APP_URL || !isIpHost(origin))
  .map((origin) => new URL(origin).host);

/**
 * The single Better Auth instance: Google is the only sign-in method.
 * Used by the `/api/auth/[...all]` route and every server-side session check.
 */
export const auth = betterAuth({
  // Build auth URLs (OAuth redirect, callbacks) from the host the request
  // came in on, so signing in on 192.168.x.x or a tunnel returns there
  // instead of APP_URL. Only listed hosts are accepted; anything else
  // falls back to APP_URL.
  baseURL: {
    allowedHosts: authHosts,
    fallback: env.APP_URL,
  },
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: origins,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
      rateLimit: rateLimits,
    },
  }),
  // Ids come from Postgres (`gen_random_uuid()` via `...id`).
  advanced: { database: { generateId: false } },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      prompt: "select_account",
    },
  },

  session: {
    expiresIn: 30 * DAY,
    // Extend the session once it's older than 15 days.
    updateAge: 15 * DAY,
    // Session read from a signed cookie for up to 5 min (no DB hit).
    // Sensitive actions use `getFreshSession()` to bypass it.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  user: {
    additionalFields: {
      role: { type: "string", input: false },
      status: { type: "string", input: false },
      username: { type: "string", input: false },
      bio: { type: "string", input: false, required: false },
    },
  },

  // On by default in production only. Counters live in `rate_limits` so the
  // limit holds across serverless instances (memory would reset per instance).
  rateLimit: { storage: "database" },

  // A user who previously signed up with the same Gmail keeps their account.
  account: {
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            ...user,
            role: "business_owner",
            status: "active",
            username: await generateUniqueUsername(user.name),
          },
        }),
        after: async (user) => {
          await ensurePersonalProfile(user.id);
        },
      },
    },
    session: {
      create: {
        // Covers every sign-in; `requireUser()` also catches accounts
        // suspended after their session started.
        before: async (session) => {
          const [user] = await db
            .select({ status: users.status })
            .from(users)
            .where(eq(users.id, session.userId))
            .limit(1);
          if (user?.status === "suspended") {
            // `code` becomes `?error=account_suspended` on the OAuth redirect.
            throw new APIError("FORBIDDEN", {
              code: "account_suspended",
              message: "account_suspended",
            });
          }
          return { data: session };
        },
      },
    },
  },

  plugins: [nextCookies()], // must stay last
});

export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
