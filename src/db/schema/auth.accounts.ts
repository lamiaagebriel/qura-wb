import {
  createdAt,
  id,
  pgTable,
  references,
  text,
  timestamp,
  updatedAt,
  varchar,
} from "@/db/helpers";
import { index, uniqueIndex } from "drizzle-orm/pg-core";

import { users } from "./g.users";

/**
 * Better Auth's "account" model — one row per way a user can sign in.
 * `providerId` is `"credential"` for email/password (in which case
 * `password` holds the argon2 hash and `accountId` is just the user's own
 * id), or an OAuth provider id (`"google"`, ...) for social sign-in, in
 * which case `accountId` is that provider's stable subject/user id and
 * `password` is null.
 *
 * Adding a new OAuth provider is purely a Better Auth config change
 * (`socialProviders` in `lib/auth/auth.ts`) — no schema change needed here.
 */
export const accounts = pgTable(
  "accounts",
  {
    ...id,
    ...createdAt,
    ...updatedAt,

    userId: references({
      k: "user_id",
      ref: users.id,
      actions: { onDelete: "cascade" },
    }).notNull(),

    accountId: varchar("account_id").notNull(),
    providerId: varchar("provider_id").notNull(),

    // `text`, not `varchar(2048)` — a Google `idToken` (JWT) or a
    // password hash is usually well under that, but there's no real upper
    // bound Better Auth guarantees, and this table is exactly where the
    // `verifications.value` overflow bug also lived. Not worth capping.
    password: text("password"),

    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: varchar("scope"),
  },
  (t) => [
    uniqueIndex("account__provider_id__account_id__idx").on(
      t.providerId,
      t.accountId,
    ),
    index("account__user_id__idx").on(t.userId),
  ],
);

export type Account = typeof accounts.$inferSelect;

// Providers we show a "signed in with ___" label for — kept separate from
// Better Auth's `socialProviders` config so display copy doesn't need a
// live provider client. `"credential"` (email/password) is deliberately
// excluded; see `lib/auth/oauth/registry.ts`.
export const OAUTH_PROVIDERS = ["google"] as const;
export type OAuthProviderId = (typeof OAUTH_PROVIDERS)[number];
