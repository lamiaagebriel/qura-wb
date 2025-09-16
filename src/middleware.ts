import { NextResponse, type NextRequest } from "next/server";

import { i18n, Locale } from "@/lib/locale";

export function middleware(request: NextRequest) {
  // ----------------- localization
  const searchLocale = request.nextUrl.searchParams.get("locale");
  const cookieLocale = request?.cookies?.get("locale")?.value;
  const headerLocale = request?.headers
    .get("accept-language")
    ?.split(",")[0]
    .split("-")[0];

  const resolvedLocale = i18n.locales.includes(searchLocale as Locale)
    ? (searchLocale as Locale)
    : i18n.locales.includes(cookieLocale as Locale)
      ? (cookieLocale as Locale)
      : i18n.locales.includes(headerLocale as Locale)
        ? (headerLocale as Locale)
        : i18n.defaultLocale;

  const response = NextResponse.next();
  // If `locale` search param exists, update the locale cookie
  if (!cookieLocale || (searchLocale && resolvedLocale !== cookieLocale)) {
    response.cookies.set("locale", resolvedLocale, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return response;
}

export const config = {
  // Skip internal Next.js paths
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
