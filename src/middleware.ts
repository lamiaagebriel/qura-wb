import { NextResponse, type NextRequest } from "next/server";

import { verifyRequestOrigin } from "lucia";

import { i18n, Locale } from "@/lib/locale";

export function middleware(request: NextRequest) {
  // ----------------- localization
  const cookieLocale = request?.cookies?.get("locale")?.value;
  const headerLocale = request?.headers
    .get("accept-language")
    ?.split(",")[0]
    .split("-")[0];

  const locale = i18n?.locales?.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : i18n?.locales?.includes(headerLocale as Locale)
      ? (headerLocale as Locale)
      : i18n?.defaultLocale;

  if (!cookieLocale) {
    const response = NextResponse.next();
    response.cookies.set("locale", locale, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return response;
  }

  // ----------------- authorization
  if (request.method === "GET") return NextResponse.next();

  const originHeader = request.headers.get("Origin");
  const hostHeader = request.headers.get("Host");
  if (
    !originHeader ||
    !hostHeader ||
    !verifyRequestOrigin(originHeader, [hostHeader])
  )
    return new NextResponse(null, { status: 403 });

  return NextResponse.next();
}

export const config = {
  // Skip internal Next.js paths
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
