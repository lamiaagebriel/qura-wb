import { Metadata } from "next";

import { getDictionary } from "@/lib/dictionaries";
import { LocaleProps } from "@/types/locale";

import { DashboardLayout } from "@/components/dashboard-layout";
import { StoreCreateButton } from "@/components/store/store-create-button";
import { StoresTable } from "@/components/store/stores-table";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";

type StoresProps = Readonly<{
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

export default async function Stores({ params: { lang } }: StoresProps) {
  const dic = await getDictionary(lang);
  const c = dic?.["dashboard"]?.["user"]?.["stores"];
  const user = (await getAuth())?.["user"]!;

  const stores = await db.store.findMany({
    where: { userId: user?.["id"], deletedAt: null },
  });

  return (
    <DashboardLayout>
      <DashboardLayout.Header>
        <div>
          <DashboardLayout.Title>{c?.["stores"]}</DashboardLayout.Title>
          <DashboardLayout.Description>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit.
          </DashboardLayout.Description>
        </div>

        <div>
          <StoreCreateButton dic={dic} />
        </div>
      </DashboardLayout.Header>

      <StoresTable dic={dic} data={stores} />
    </DashboardLayout>
  );
}
