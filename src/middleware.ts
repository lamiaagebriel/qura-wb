import { NextRequest, NextResponse } from "next/server";

export const LOCALES = ["en", "fr", "de", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function middleware(request: NextRequest) {
  // ----------------- localization
  const cookieLocale = request.cookies.get("locale")?.value;
  console.log({ cookieLocale });

  const headerLocale = request.headers
    .get("accept-language")
    ?.split(",")[0]
    .split("-")[0];
  const locale =
    cookieLocale ||
    (LOCALES.includes(headerLocale as Locale) ? headerLocale : DEFAULT_LOCALE);
  console.log({ locale });

  const response = NextResponse.next();
  response.cookies.set("locale", locale!, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/", // Ensure cookie is available across the entire site
  });

  return response;
}

export const config = {
  // Skip internal Next.js paths
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
