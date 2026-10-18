/**
 * Database schema. One file per domain, each re-exported here; both the db
 * client and drizzle-kit read the schema from this folder.
 *
 * Core tables hold facts and one status. Everything that grows new kinds
 * lives in two flexible tables:
 * - `tickets`: every request and report (a registry in code says each type).
 * - `history`: every action and every row change (a trigger on every table).
 *
 *   users ──1:N── sessions, accounts            who signs in, how
 *     │   ──1:N── businesses (owner / added by)
 *   places (a tree) ──1:N── place_admins, business_locations, posts
 *   businesses ──1:N── business_locations, business_follows, business_reviews, posts
 *   posts ──1:N── replies (posts), post_votes, post_saves
 *   tickets.refs → any record · history → any record
 *
 * Postgres functions and triggers (has_text, history_record_change, the
 * place-tree and last-super-admin guards…) are in the migrations.
 */
export * from "./auth";
export * from "./places";
export * from "./businesses";
export * from "./posts";
export * from "./tickets";
export * from "./history";
