import { NextResponse, type NextRequest } from "next/server";

import {
  isLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_OPTIONS,
  LOCALE_HEADER,
  LOCALE_PARAM,
} from "@/lib/i18n/config";

// `?lang=ar` switches the language and remembers it, like the switcher.
// Layouts can't read search params, so this request gets it as the
// `x-locale` header `getLocale()` checks first; the cookie covers the rest.
export function proxy(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get(LOCALE_PARAM);
  if (!isLocale(lang)) return NextResponse.next();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, lang);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set(LOCALE_COOKIE, lang, LOCALE_COOKIE_OPTIONS);
  return response;
}

export const config = {
  // Only run when `?lang=` is present; everything else skips the proxy.
  // Must be a literal (statically analyzed) — keep in sync with LOCALE_PARAM.
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      has: [{ type: "query", key: "lang" }],
    },
  ],
};
