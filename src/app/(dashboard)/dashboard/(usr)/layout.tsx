import { redirect } from "next/navigation";

import { Paths } from "@/constants";

import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { NavLink } from "@/components/ui/link";
import { StoreCreateButton } from "@/components/store-create-button";
import { ModeSwitcherDropdownMenu } from "@/components/theme-provider";
import { UserAccountNav } from "@/components/user-account-nav";

type DashboardLayoutProps = React.PropsWithChildren<{}>;
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const dic = await getDictionary();
  const c = dic["dashboard"];
  const cmn = dic["cmn"];

  return (
    <div className="bg-muted/50 flex min-h-screen flex-col">
      <header className="bg-background text-foreground z-20 flex flex-col gap-4 py-4">
        <div className="container flex items-center justify-between gap-4">
          <Breadcrumbs
            items={[
              {
                value: Paths.Home,
                children: (
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarFallback>
                        <Icons.logo className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                    <h1 className="hidden font-semibold sm:block">
                      {dic["site"]["name"]}
                    </h1>
                  </div>
                ),
              },
            ]}
          />
          <div className="flex items-center gap-2">
            <ModeSwitcherDropdownMenu />
            <UserAccountNav items={c["user-nav"]} />
          </div>
        </div>
      </header>

      <header className="scrollbar-none bg-background sticky top-0 z-20 flex flex-col gap-4 overflow-y-auto border-b pt-4">
        <div className="container">
          <nav className="flex items-center justify-between gap-2">
            <ul className="flex items-center gap-1">
              {c["user-nav"]
                ?.filter((e) =>
                  user?.emailVerified ? e?.value !== Paths.VerifyEmail : e
                )
                ?.map((e, i) => {
                  const Icon = e?.icon ? Icons[e?.icon] : null;

                  return (
                    <li key={i}>
                      <NavLink
                        disabled={e?.disabled}
                        segments={e?.segments}
                        href={e?.value}
                        className={cn(buttonVariants({ variant: "ghost" }))}
                        activeClassNames={cn(
                          buttonVariants({ variant: "secondary" }),
                          "border-primary hover:text-secondary-foreground rounded-b-none border-b"
                        )}
                      >
                        {Icon && <Icon />}
                        {e?.children}
                      </NavLink>
                    </li>
                  );
                })}
            </ul>

            <div>{!user?.stores?.[0]?.id && <StoreCreateButton />}</div>
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
