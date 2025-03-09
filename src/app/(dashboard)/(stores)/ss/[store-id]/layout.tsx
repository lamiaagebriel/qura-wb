import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";

import { queries } from "@/servers/db/queries";
import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Link, NavLink } from "@/components/link";
import { UserAccountNav } from "@/components/user-account-nav";

type StoreLayoutProps = React.PropsWithChildren<
  Readonly<{ params: Promise<{ "store-id": string }> }>
>;

export default async function StoreLayout({
  children,
  params,
}: StoreLayoutProps) {
  const { "store-id": storeId } = await params;
  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const dic = await getDictionary();
  const c = dic["stores"]["store"];
  const dashboard = dic["dashboard"];
  const cmn = dic["cmn"];

  const { data: selectedStore } = await queries.stores.get({ id: storeId });
  if (!selectedStore) return <div>NO STORE</div>;

  return (
    <div className="flex min-h-screen flex-col bg-muted/50">
      <header className="z-20 flex flex-col gap-4 bg-background py-4 text-foreground">
        <div className="container flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              href={Paths.Dashboard}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Icons.chevronLeft />
              {cmn["back"]}
            </Link>
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
                      <h1 className="hidden font-semibold sm:block">
                        {dic["site"]["name"]}
                      </h1>
                    </div>
                  ),
                },
                {
                  value: `/ss/${storeId}`,
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
              className={cn(buttonVariants({ size: "sm" }))}
            >
              <Icons.eye />
              {cmn["preview"]}
            </Link>
            <UserAccountNav
              items={dashboard["user-nav"]?.filter((e) =>
                user?.emailVerified ? e?.value !== Paths.VerifyEmail : e
              )}
            />
          </div>
        </div>
      </header>

      <header className="scrollbar-none sticky top-0 z-20 flex flex-col gap-4 overflow-y-auto border-b bg-background">
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
                      href={`/ss/${storeId}${e?.value}`}
                      className={cn(buttonVariants({ variant: "ghost" }))}
                      activeClassNames={cn(
                        buttonVariants({ variant: "secondary" }),
                        "rounded-b-none border-b border-primary hover:text-secondary-foreground"
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
