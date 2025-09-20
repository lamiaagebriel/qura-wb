import { redirect } from "next/navigation";

import { Paths } from "@/constants";

import { getAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getDictionary } from "@/servers/locale";

import { buttonVariants } from "@/components/ui/button";
import { NavLink } from "@/components/ui/link";
import { Separator } from "@/components/ui/separator";

type SettingsLayoutProps = React.PropsWithChildren<Readonly<{}>>;
export default async function SettingsLayout({
  children,
}: SettingsLayoutProps) {
  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const dic = await getDictionary();
  const c = dic["dashboard"]["settings"];

  return (
    <div className="flex-1">
      <div className="container flex flex-1 flex-col py-6">
        <div>
          <div className="space-y-0.5">
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              {c["settings"]}
            </h2>
            <p className="text-muted-foreground text-sm">
              {
                c[
                  "manage your account details, privacy settings, and how others perceive you on the platform."
                ]
              }
            </p>
          </div>

          <Separator className="my-6" />
        </div>
        <div className="container flex flex-col gap-12 lg:flex-row">
          <aside className="-mx-4 lg:w-1/5">
            <nav className="flex flex-col gap-1">
              {c["main-nav"]?.map((e, i) => (
                <NavLink
                  key={i}
                  href={e?.value}
                  segments={e?.segments}
                  disabled={e?.disabled}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "justify-start hover:bg-transparent hover:underline"
                  )}
                  activeClassNames="bg-secondary hover:bg-secondary"
                >
                  {e?.children}
                </NavLink>
              ))}
            </nav>
          </aside>

          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
