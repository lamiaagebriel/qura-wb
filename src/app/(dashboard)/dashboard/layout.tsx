import { redirect } from "next/navigation";

import { Paths } from "@/constants";

import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Link } from "@/components/link";
import { UserAccountNav } from "@/components/user-account-nav";

type DashboardLayoutProps = React.PropsWithChildren<Readonly<{}>>;
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const { cmn, ...dic } = await getDictionary();
  const c = dic["dashboard"];

  return (
    <div className="bg-muted/50 flex min-h-screen flex-col">
      <header className="bg-background text-foreground z-20 flex flex-col gap-4 border-b py-4">
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

                    <h1 className="font-semibold">{dic["site"]["name"]}</h1>
                  </div>
                ),
              },
            ]}
          />

          <div className="flex items-center gap-2">
            <Link
              href={Paths.DashboardStores}
              className={buttonVariants({ size: "sm" })}
            >
              {cmn["work with us"]}
            </Link>

            <UserAccountNav items={c["user-nav"]} />
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
