import { getLocale, i18n } from "@/lib/locale";
import type { NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
	// -------------------- localization
	// Check if there is any supported locale in the pathname
	const { pathname } = req.nextUrl;
	const pathnameHasLocale = i18n.locales.some(
		(locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
	);

	if (pathnameHasLocale) return;

	// Redirect if there is no locale
	const locale = getLocale(req);
	req.nextUrl.pathname = `/${locale}${pathname}`;
	// e.g. incoming request is /products
	// The new URL is now /en-US/products
	return Response.redirect(req.nextUrl);
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
