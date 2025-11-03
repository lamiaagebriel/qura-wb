import { redirect } from "next/navigation";

import { Paths } from "@/constants";
import { queries } from "@/db/queries";

import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Link, NavLink } from "@/components/ui/link";
import { ModeSwitcherDropdownMenu } from "@/components/theme-provider";
import { UserAccountNav } from "@/components/user-account-nav";

type StoreDashboardLayoutProps = React.PropsWithChildren<{
  params: Promise<{ "store-id": string }>;
}>;
export default async function StoreDashboardLayout({
  children,
  params,
}: StoreDashboardLayoutProps) {
  const { "store-id": storeId } = await params;
  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const dic = await getDictionary();
  const c = dic["dashboard"]["store-id"];
  const dashboard = dic["dashboard"];
  const cmn = dic["cmn"];

  const { data: selectedStore } = await queries.stores.get({ id: storeId });
  if (!selectedStore) return <div>NO STORE</div>;

  return (
    <div className="bg-muted/50 flex min-h-screen flex-col">
      <header className="bg-background text-foreground z-20 flex flex-col gap-4 py-4">
        <div className="container flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
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
                {
                  value: Paths.Dashboard,
                  children: (
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6">
                        <AvatarFallback>
                          <Icons.user />
                        </AvatarFallback>
                      </Avatar>
                      <h1 className="hidden font-semibold sm:block">
                        {
                          // user?.name ??
                          user?.email?.split("@")?.[0]
                        }
                      </h1>
                    </div>
                  ),
                },
                {
                  value: `${Paths.DashboardStore}/${storeId}`,
                  children: (
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6">
                        <AvatarImage src={selectedStore?.logo ?? ""} />
                        <AvatarFallback>
                          <Icons.store />
                        </AvatarFallback>
                      </Avatar>
                      <h1 className="font-semibold">{selectedStore?.name}</h1>
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <Link
              target="_blank"
              href={`${Paths.Store}/${storeId}`}
              className={cn(buttonVariants({ size: "sm" }), "")}
            >
              <Icons.eye />
              <p className="hidden md:block"> {cmn["preview"]}</p>
            </Link>
            <ModeSwitcherDropdownMenu />
            <UserAccountNav items={dashboard["user-nav"]} />
          </div>
        </div>
      </header>

      <header className="scrollbar-none bg-background sticky top-0 z-20 flex flex-col gap-4 overflow-y-auto border-b pt-4">
        <div className="container">
          <nav>
            <ul className="flex items-center gap-1">
              {c["main-nav"]?.map((e, i) => {
                const Icon = e?.icon ? Icons[e?.icon] : null;

                return (
                  <li key={i}>
                    <NavLink
                      disabled={e?.disabled}
                      segments={e?.segments}
                      href={`${Paths.DashboardStore}/${storeId}${e?.value}`}
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
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
