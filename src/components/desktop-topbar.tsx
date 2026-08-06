import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/guard";
import { getLocale } from "@/lib/i18n/actions";

/** `sm:flex` only — on mobile, `BottomNav` covers these same destinations. */
export async function DesktopTopBar() {
  const [user, { t }] = await Promise.all([getCurrentUser(), getLocale()]);

  return (
    <header className="border-border/50 bg-background/85 sticky top-0 z-40 hidden border-b backdrop-blur-xl md:block">
      <nav className="container flex h-14.5 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-foreground text-[20px] font-bold tracking-tight"
          >
            qura<span className="text-primary">.</span>
          </Link>
          <div className="text-muted-foreground flex items-center gap-4 text-[13px] font-medium">
            <Link href="/search" className="hover:text-foreground">
              {t("Search")}
            </Link>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={user ? "/account" : "/login"}>
            {user ? t("Profile") : t("Sign in")}
          </Link>
        </Button>
      </nav>
    </header>
  );
}
