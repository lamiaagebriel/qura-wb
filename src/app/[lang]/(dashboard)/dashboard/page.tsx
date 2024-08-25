import { Metadata } from "next";

import { getDictionary } from "@/lib/dictionaries";
import { LocaleProps } from "@/types/locale";

import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardPostsBarChart } from "@/components/dashboard-posts-bar-char";

type DashboardProps = Readonly<{
  params: LocaleProps;
}>;

export async function generateMetadata({
  params: { lang },
}: Readonly<{
  params: LocaleProps;
}>): Promise<Metadata> {
  const {
    dashboard: {
      user: { meta: c },
    },
  } = await getDictionary(lang);

  return {
    title: c?.["title"],
  };
}

export default async function Dashboard({ params: { lang } }: DashboardProps) {
  const dic = await getDictionary(lang);
  const c = dic?.["dashboard"]?.["user"];

  return (
    <DashboardLayout>
      <DashboardLayout.Header>
        <div>
          <DashboardLayout.Title>{c?.["dashboard"]}</DashboardLayout.Title>
          <DashboardLayout.Description>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit.
          </DashboardLayout.Description>
        </div>

        <div>{/* Action Buttons */}</div>
      </DashboardLayout.Header>
      <DashboardPostsBarChart dic={dic} />
    </DashboardLayout>
  );
}
