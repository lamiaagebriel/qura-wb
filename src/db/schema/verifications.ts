import { createdAt, id, pgTable, text, timestamp, updatedAt, varchar } from "@/db/helpers";
import { index } from "drizzle-orm/pg-core";

/**
 * Better Auth's "verification" model — generic (identifier, value) storage
 * it uses internally for email-verification and password-reset tokens, but
 * also for the OAuth sign-in flow's state (state token, PKCE code
 * verifier, callback/error URLs) as a JSON blob in `value` — easily past
 * 255 characters, hence `text` and not `varchar`. `identifier` is
 * typically the user's email or an OAuth state token; there's no `userId`
 * column by design (this is how Better Auth's own schema is shaped), so
 * this table is never queried directly by app code — only through
 * `auth.api.*` in `lib/auth/actions/*`.
 */
export const verifications = pgTable(
  "verifications",
  {
    ...id,
    ...createdAt,
    ...updatedAt,

    identifier: varchar("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (t) => [index("verification__identifier__idx").on(t.identifier)],
);

export type Verification = typeof verifications.$inferSelect;
