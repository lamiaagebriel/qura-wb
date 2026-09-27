import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

import { loginPath } from "@/lib/auth/redirect";
import {
  isLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_OPTIONS,
  LOCALE_HEADER,
  LOCALE_PARAM,
} from "@/lib/i18n/config";

// Routes that need a signed-in user (prefix match, so sub-paths count too).
// None yet — add e.g. `href("settings")` from `@/lib/routes`.
const PROTECTED_PREFIXES: string[] = [];

/**
 * Two cheap, cookie-only jobs — never a final auth decision (pages call
 * `requireUser()` for that):
 * 1. Protected route with no session cookie → `/login?next=<path>`.
 *    Signed-in users are never bounced away from `/login` here; a stale
 *    cookie would otherwise cause a redirect loop.
 * 2. `?lang=ar` switches the language and remembers it. Layouts can't read
 *    search params, so this request gets it as the `x-locale` header.
 */
export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  const lang = searchParams.get(LOCALE_PARAM);
  const requestHeaders = new Headers(request.headers);
  if (isLocale(lang)) requestHeaders.set(LOCALE_HEADER, lang);

  const response =
    isProtected && !getSessionCookie(request)
      ? NextResponse.redirect(
          new URL(loginPath(pathname + search), request.url),
        )
      : NextResponse.next({ request: { headers: requestHeaders } });

  if (isLocale(lang)) {
    response.cookies.set(LOCALE_COOKIE, lang, LOCALE_COOKIE_OPTIONS);
  }
  return response;
}

export const config = {
  // Every page (not API, static files or images); which routes are protected
  // is decided above from `routes`, so no paths are repeated here.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.[\\w]+$).*)"],
};
