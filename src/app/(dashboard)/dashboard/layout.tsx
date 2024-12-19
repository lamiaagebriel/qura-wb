import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";

import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { NavLink } from "@/components/link";
import { UserAccountNav } from "@/components/user-account-nav";

type DashboardLayoutProps = React.PropsWithChildren<Readonly<{}>>;
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const dic = await getDictionary();
  const c = dic?.["dashboard"];

  return (
    <div className="flex min-h-screen flex-col bg-muted/50">
      <header className="flex flex-col gap-4 bg-background pt-4 text-foreground">
        <div className="container flex items-center justify-between gap-4">
          <Breadcrumbs
            items={[
              {
                value: Paths.Dashboard,
                children: (
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarFallback>
                        <Icons.logo className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                    <h1 className="font-semibold">{dic?.["site"]?.["name"]}</h1>
                  </div>
                ),
              },
            ]}
          />

          <UserAccountNav items={c?.["user-nav"]} />
        </div>
      </header>

      <header className="scrollbar-none sticky top-0 flex flex-col gap-4 overflow-y-auto border-b bg-background pt-2">
        <div className="container">
          <nav>
            <ul className="flex items-center gap-1">
              {c?.["main-nav"]?.map((e, i) => {
                const Icon = e?.["icon"] ? Icons?.[e?.["icon"]] : null;

                return (
                  <li key={i}>
                    <NavLink
                      disabled={e?.["disabled"]}
                      segments={e?.["segments"]}
                      href={e?.["value"]}
                      className={cn(buttonVariants({ variant: "ghost" }))}
                      activeClassNames={cn(
                        buttonVariants({ variant: "secondary" }),
                        "rounded-b-none border-b border-primary hover:text-secondary-foreground"
                      )}
                    >
                      {Icon && <Icon />}
                      {e?.["children"]}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
