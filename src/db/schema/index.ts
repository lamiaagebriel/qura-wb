/**
 * Database schema. One file per domain, each re-exported here; both the db
 * client and drizzle-kit read the schema from this folder.
 *
 *   users ──1:N── sessions       who is signed in, on which device
 *     │   ──1:N── accounts       how they sign in (Google)
 *     │   ──1:1── profiles       their personal public identity
 *   verifications                short-lived OAuth state (standalone)
 *   rate_limits                  request counters (standalone)
 *   profiles (business) ──N:1── organization (later)
 *
 * - `users.ts`    the private person behind the account (used by auth + app).
 * - `auth.ts`     tables only Better Auth uses; app code never touches them.
 * - `profiles.ts` the public identity: what posts, gets followed, is searched.
 *   New social tables (threads, follows, reviews…) reference `profiles.id`,
 *   never `users.id`, so a business can act without being a fake user.
 */
export * from "./users";
export * from "./auth";
export * from "./profiles";
