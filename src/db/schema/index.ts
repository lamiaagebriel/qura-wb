/**
 * Database schema. One file per domain, each re-exported here; both the db
 * client and drizzle-kit read the schema from this folder.
 *
 *   users ──1:N── sessions       who is signed in, on which device
 *     │   ──1:N── accounts       how they sign in (Google)
 *     │   ──1:N── businesses     the businesses they own
 *   verifications                short-lived OAuth state (standalone)
 *   rate_limits                  request counters (standalone)
 *
 * - `auth.ts`       Better Auth's tables. `users` (the private person, never
 *   shown) is also used by the app; the rest only by Better Auth.
 * - `businesses.ts` the only public identity: followed, reviewed, searched.
 *   Social tables (follows, reviews…) point the actor at `users.id` and the
 *   target at `businesses.id`.
 */
export * from "./auth";
export * from "./businesses";
export * from "./business-details";
export * from "./social";
