import { DashboardLayout } from "@/components/dashboard-layout";
import { SidebarNav } from "@/components/sidebar-nav";
import { Separator } from "@/components/ui/separator";
import { getDictionary } from "@/lib/dictionaries";
import { LocaleProps } from "@/types/locale";

type BinLayoutProps = Readonly<{
  children: React.ReactNode;
  params: LocaleProps;
}>;

export default async function BinLayout({
  children,
  params: { lang },
}: BinLayoutProps) {
  const {
    dashboard: {
      user: { bin: c },
    },
    ...dic
  } = await getDictionary(lang);
  return (
    <DashboardLayout>
      <DashboardLayout.Header>
        <div>
          <DashboardLayout.Title>{c?.["bin"]}</DashboardLayout.Title>
          <DashboardLayout.Description>
            {
              c?.[
                "below is a list of your deleted items. you can restore them within 30 days before they are permanently removed."
              ]
            }
          </DashboardLayout.Description>
        </div>
      </DashboardLayout.Header>
      <Separator className="my-6" />
      <div className="container flex flex-col gap-8 lg:flex-row lg:gap-12">
        <aside className="-mx-4 lg:w-1/5">
          <SidebarNav items={c?.["main-nav"]} />
        </aside>
        <Separator className="my-2 lg:hidden" />
        <div className="flex-1">{children}</div>
      </div>
    </DashboardLayout>
  );
}
