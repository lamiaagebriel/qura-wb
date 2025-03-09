import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";

import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Icons } from "@/components/icons";
import { UserAccountNav } from "@/components/user-account-nav";

type DashboardLayoutProps = React.PropsWithChildren<Readonly<{}>>;
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const dic = await getDictionary();
  const c = dic["dashboard"];

  return (
    <div className="flex min-h-screen flex-col bg-muted/50">
      <header className="z-20 flex flex-col gap-4 border-b bg-background py-4 text-foreground">
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

                    <h1 className="font-semibold">{dic["site"]["name"]}</h1>
                  </div>
                ),
              },
            ]}
          />

          <UserAccountNav
            items={c["user-nav"]?.filter((e) =>
              user?.emailVerified ? e?.value !== Paths.VerifyEmail : e
            )}
          />
        </div>
      </header>

      {children}
    </div>
  );
}
