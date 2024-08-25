import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/lib/auth";
import { getDictionary } from "@/lib/dictionaries";
import { LocaleProps } from "@/types/locale";

import { ResizableLayout } from "@/components/resizable-layout";

type DashboardLayoutProps = Readonly<{
  children: React.ReactNode;
  params: LocaleProps;
}>;

export default async function DashboardLayout({
  children,
  params: { lang },
}: DashboardLayoutProps) {
  const dic = await getDictionary(lang);
  const c = dic?.["dashboard"]?.["user"];

  const { user } = await getAuth();
  if (!user) redirect(`/${lang}/login`);

  // collapsing properties
  const layout =
    cookies().get("react-resizable-panels:layout")?.["value"] ?? undefined;
  const collapsed =
    cookies().get("react-resizable-panels:collapsed")?.["value"] ?? undefined;

  return (
    <ResizableLayout
      dic={dic}
      user={user}
      defaultLayout={layout ? JSON.parse(layout) : undefined}
      defaultCollapsed={collapsed ? JSON.parse(collapsed) : undefined}
      navCollapsedSize={4}
      links={c?.["main-nav"]}
    >
      {children}
    </ResizableLayout>
  );
}
