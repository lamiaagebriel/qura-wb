import { NextResponse, type NextRequest } from "next/server";

import { verifyRequestOrigin } from "lucia";

import { ensureValidLocale, i18n, Locale } from "@/lib/locale";

export function middleware(request: NextRequest) {
  // ----------------- localization
  const searchLocale = request.nextUrl.searchParams.get("locale");
  const cookieLocale = request?.cookies?.get("locale")?.value;
  const headerLocale = request?.headers
    .get("accept-language")
    ?.split(",")[0]
    .split("-")[0];

  // Resolve locale with priority: search param > cookie > header > default
  const resolvedLocale = ensureValidLocale(
    searchLocale || cookieLocale || headerLocale
  );

  const response = NextResponse.next();

  // Always ensure locale cookie is set with a valid value
  if (
    !cookieLocale ||
    !i18n.locales.includes(cookieLocale as Locale) ||
    (searchLocale && resolvedLocale !== cookieLocale)
  ) {
    response.cookies.set("locale", resolvedLocale, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  // ----------------- authorization
  if (request.method === "GET") return response;

  const originHeader = request.headers.get("Origin");
  const hostHeader = request.headers.get("Host");
  if (
    !originHeader ||
    !hostHeader ||
    !verifyRequestOrigin(originHeader, [hostHeader])
  )
    return new NextResponse(null, { status: 403 });

  return response;
}

export const config = {
  // Skip internal Next.js paths
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
