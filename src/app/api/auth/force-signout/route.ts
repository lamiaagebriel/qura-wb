import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/lib/auth/auth";

/**
 * Reached via `redirect()` from a Server Component (a protected layout/page)
 * whenever the browser's session cookie turns out to be stale — the
 * account got suspended after the session was created, the session row
 * expired/was revoked, or the DB was reset out from under it. Server
 * Components can read cookies but never write them, so the sign-out has to
 * happen here instead, in a real Route Handler, where clearing the cookie
 * actually takes effect. Skipping this hop leaves the stale-but-well-formed
 * cookie on the browser, and `proxy.ts` (which only checks that a session
 * cookie is present, not that it's still valid) bounces `/login` straight
 * back to the protected route forever.
 */
export async function GET(request: NextRequest) {
  await auth.api.signOut({ headers: await headers() });

  const loginUrl = new URL("/login", request.url);
  const error = request.nextUrl.searchParams.get("error");
  if (error) loginUrl.searchParams.set("error", error);

  return NextResponse.redirect(loginUrl);
}
