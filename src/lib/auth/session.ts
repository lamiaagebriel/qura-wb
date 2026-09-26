import "server-only";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "./auth";
import { ensurePersonalProfile } from "./profile";
import { loginPath } from "./redirect";

export { ensurePersonalProfile };

/**
 * The current session or `null`, memoized per request. May be served from
 * the signed cookie cache (up to 5 min old) — fine for rendering.
 */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

/**
 * Always read from the database. Use before posting, following, editing
 * and every admin action, so a just-suspended user can't act on a cached
 * session.
 */
export async function getFreshSession() {
  return auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
}

/**
 * The signed-in user, or a redirect to `/login` (with `?next=` so they come
 * back here). Suspended accounts are sent to `/login?error=account_suspended`.
 * Uses the cached session — no DB query — so it's for rendering only;
 * writes must re-check with `getFreshSession()`.
 */
export async function requireUser(returnTo?: string) {
  const session = await getSession();
  if (!session) redirect(loginPath(returnTo));

  if (session.user.status === "suspended") {
    redirect(loginPath(returnTo, "account_suspended"));
  }

  return session.user;
}

/** A signed-in `super_admin` (fresh session), otherwise a 404. */
export async function requireAdmin() {
  const session = await getFreshSession();
  if (
    !session ||
    session.user.status === "suspended" ||
    session.user.role !== "super_admin"
  ) {
    notFound();
  }
  return session.user;
}
