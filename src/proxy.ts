import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

import { loginPath } from "@/lib/auth/redirect";
import {
  isLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_OPTIONS,
  LOCALE_PARAM,
} from "@/lib/i18n/config";

// Routes that need a signed-in user (prefix match, so sub-paths count too).
// None yet — add e.g. `href("businesses")` from `@/lib/routes`.
const PROTECTED_PREFIXES: string[] = [];

/**
 * Two cheap, cookie-only jobs — never a final auth decision (pages call
 * `requireUser()` for that):
 * 1. `?lang=ar` saves the language cookie and redirects to the same URL
 *    without `?lang`, so the parameter never lingers in the address bar
 *    (where every later request — even switching language in Settings —
 *    would force it again).
 * 2. Protected route with no session cookie → `/login?next=<path>`.
 *    Signed-in users are never bounced away from `/login` here; a stale
 *    cookie would otherwise cause a redirect loop.
 */
export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;

  const lang = searchParams.get(LOCALE_PARAM);
  if (searchParams.has(LOCALE_PARAM)) {
    const clean = request.nextUrl.clone();
    clean.searchParams.delete(LOCALE_PARAM);
    const response = NextResponse.redirect(clean);
    if (isLocale(lang)) {
      response.cookies.set(LOCALE_COOKIE, lang, LOCALE_COOKIE_OPTIONS);
    }
    return response;
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isProtected && !getSessionCookie(request)) {
    return NextResponse.redirect(
      new URL(loginPath(pathname + search), request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  // Every page (not API, static files or images); which routes are protected
  // is decided above, so no paths are repeated here.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.[\\w]+$).*)"],
};
