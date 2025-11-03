import { redirect } from "next/navigation";

import { Paths } from "@/constants";
import { queries } from "@/db/queries";

import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Icons } from "@/components/ui/icons";
import { CartLink } from "@/components/cart-icon";
import { ModeSwitcherDropdownMenu } from "@/components/theme-provider";
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
  const c = dic["dashboard"];

  const { data: selectedStore } = await queries.stores.get({ id: storeId });
  if (!selectedStore) return <div>NO STORE</div>;

  return (
    <div className="bg-muted/20 flex min-h-screen flex-col">
      <header className="scrollbar-none bg-background text-foreground sticky top-0 z-20 flex flex-col gap-4 overflow-y-auto border-b py-4">
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
              {
                value: `${Paths.Store}/${storeId}`,
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

          <div className="flex items-center gap-3 lg:gap-4">
            <CartLink href={`${Paths.Store}/${storeId}${Paths.StoreCart}`} />
            <ModeSwitcherDropdownMenu />
            <UserAccountNav
              items={c["user-nav"].map((e) => ({
                ...e,
                value: `${e?.value}?storeId=${storeId}`,
              }))}
            />
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
