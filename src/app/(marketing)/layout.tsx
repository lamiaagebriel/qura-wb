import { Paths } from "@/constants";

import { getDictionary } from "@/servers/locale";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Icons } from "@/components/ui/icons";
import { Link } from "@/components/ui/link";
import { ModeSwitcherDropdownMenu } from "@/components/theme-provider";
import { UserAccountNav } from "@/components/user-account-nav";

type MarketingLayoutProps = React.PropsWithChildren<Readonly<{}>>;
export default async function MarketingLayout({
  children,
}: MarketingLayoutProps) {
  const { cmn, ...dic } = await getDictionary();
  const c = dic["dashboard"];

  return (
    <div className="bg-muted/50 flex min-h-screen flex-col">
      <header className="bg-background text-foreground z-20 flex flex-col gap-4 border-b py-4">
        <div className="container flex items-center justify-between gap-4">
          <Link href={Paths.Home}>
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarFallback>
                  <Icons.logo className="size-4" />
                </AvatarFallback>
              </Avatar>

              <h1 className="font-semibold">{dic["site"]["name"]}</h1>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <UserAccountNav items={c["user-nav"]} />
            <ModeSwitcherDropdownMenu />
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
