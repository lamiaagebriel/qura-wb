import { BinStoresTable } from "@/components/bin-stores-table";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDictionary } from "@/lib/dictionaries";
import { LocaleProps } from "@/types/locale";
import type { Metadata } from "next";

type BinProjectsProps = Readonly<{ params: LocaleProps }>;

export const metadata: Metadata = { title: "Bin Projects" };
export default async function BinProjects({
  params: { lang },
}: BinProjectsProps) {
  const dic = await getDictionary(lang);
  const c = dic?.["dashboard"]?.["user"]?.["bin"];
  const user = (await getAuth())?.["user"]!;

  const stores = await db.store.findMany({
    where: {
      userId: user?.["id"],
      deletedAt: { not: null },
    },
  });

  return <BinStoresTable dic={dic} data={stores} />;
}
