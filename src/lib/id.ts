const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Every primary key in this app is a Postgres `uuid` (see `db/helpers.ts`'s
 * `id` helper — every table uses it, so this check is genuinely the same
 * for a thread id, a user id, a follow id, ...). Handing anything else to
 * a query against one of these columns makes Postgres itself throw
 * ("invalid input syntax for type uuid"), which surfaces as a raw 500
 * instead of the plain "not found" / no-op a bad id should produce.
 *
 * Use this anywhere an id arrives from outside trusted server code — a
 * route param, or an argument to a server action (which is callable with
 * arbitrary input by anyone, not just through our own UI, regardless of
 * what the client-side code that normally calls it passes). An id read
 * back off a row you just fetched from the DB doesn't need this — it's
 * already a real uuid by definition.
 */
export function isValidId(value: string): boolean {
  return UUID_RE.test(value);
}
