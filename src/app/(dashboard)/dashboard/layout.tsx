import { redirect } from "next/navigation";
import Link from "next/link";

import { UserNav } from "@/components/auth/user-nav";
import { getGuardedUser } from "@/lib/auth/guard";

type DashboardLayoutProps = React.PropsWithChildren;

/**
 * Every `/dashboard/**` route funnels through here first. This is the one
 * authoritative gate for the whole section — `proxy.ts` only does a
 * fast, DB-free pre-check (cookie present or not); this is where a real
 * session gets validated and where "verified" and "suspended" actually get
 * enforced, so individual dashboard pages never need to repeat this check.
 */
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getGuardedUser();
  if (!user) redirect("/login");
  if (!user.emailVerified) redirect("/verify-email");

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <header className="border-border/50 bg-background/85 sticky top-0 z-50 border-b backdrop-blur-xl">
        <nav className="container flex h-14.5 items-center justify-between">
          <Link
            href="/dashboard"
            className="text-foreground text-[20px] font-bold tracking-tight"
          >
            qura<span className="text-primary">.</span>
          </Link>
          <UserNav user={user} />
        </nav>
      </header>

      <main className="mx-auto w-full max-w-140 flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
