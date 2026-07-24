import { NextResponse, type NextRequest } from "next/server";

import { getSessionCookie } from "better-auth/cookies";

// Guest-only: a signed-in user has no reason to land on these — bounce them
// forward instead of showing a "create account" form they can't use.
const GUEST_ONLY_PATHS = ["/login", "/signup"];
// Requires a session at all. `/forgot-password` and `/reset-password` are
// deliberately NOT here — both are token-driven and stay reachable whether
// or not the browser also happens to hold a valid session cookie.
const PROTECTED_PREFIXES = ["/dashboard"];

/**
 * This is a fast, DB-free first pass — `getSessionCookie` only ever checks
 * that a signed session cookie is *present and well-formed*, never whether
 * it's still valid, verified, or suspended (that requires a DB round trip,
 * which this project's session model can't do from the edge runtime this
 * proxy runs in; see `lib/auth/auth.ts`). The authoritative check is
 * `getGuardedUser()` (`lib/auth/guard.ts`), called in `/dashboard`'s layout
 * and every auth page.
 *
 * That split means this proxy can occasionally send someone one hop
 * further than strictly necessary (e.g. an unverified-but-cookied visitor
 * bounced here from `/login` to `/dashboard`, which then immediately
 * redirects them again to `/verify-email`) — but it never produces a wrong
 * *final* destination, and it saves the common cases (logged-out hitting
 * `/dashboard`, logged-in hitting `/login`) an extra render entirely.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = !!getSessionCookie(request);

  if (hasSession && GUEST_ONLY_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    !hasSession &&
    PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup", "/dashboard/:path*"],
};
