import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";

export type AuthSession = typeof auth.$Infer.Session;
export type SafeUser = AuthSession["user"];

/**
 * Reads + validates the session cookie, memoized per request — safe to call
 * from any number of server components/actions in the same request tree
 * without repeat db round-trips (Better Auth's `getSession` does its own
 * internal caching too, but this keeps the call site the same as before).
 */
export const getCurrentSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function getCurrentUser(): Promise<SafeUser | null> {
  const result = await getCurrentSession();
  return result?.user ?? null;
}

/**
 * Every page that needs to know "who's signed in" should call this instead
 * of `getCurrentUser()` directly. It adds exactly one thing: a `suspended`
 * account's session is treated as already dead, even if it was created
 * before the account got suspended (a brand-new session for an
 * already-suspended user never gets this far — see the `session.create`
 * hook in `lib/auth/auth.ts`, which blocks that case at creation time).
 *
 * That revoke is what keeps this loop-free: the very next request
 * (`/login` itself) reads the same browser cookie, but the session row is
 * gone, so it resolves as logged-out and the login page just renders
 * normally with the suspended-account message instead of bouncing again.
 */
export async function getGuardedUser(): Promise<SafeUser | null> {
  const result = await getCurrentSession();
  if (!result) return null;

  if (result.user.status === "suspended") {
    await auth.api.signOut({ headers: await headers() });
    redirect("/login?error=account_suspended");
  }

  return result.user;
}

/**
 * Single source of truth for "where does a signed-in, non-suspended user
 * belong right now" — used by sign-in, sign-up, the OAuth callback, and
 * every guest-only auth page (so a logged-in user hitting `/login` lands
 * exactly where a fresh sign-in would have sent them).
 */
export function getPostAuthRedirect(
  user: Pick<SafeUser, "emailVerified">,
): string {
  return user.emailVerified ? "/dashboard" : "/verify-email";
}
