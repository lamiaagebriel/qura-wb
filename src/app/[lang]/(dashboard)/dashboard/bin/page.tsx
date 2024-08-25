import { BinStoresTable } from "@/components/bin-stores-table";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDictionary } from "@/lib/dictionaries";
import { LocaleProps } from "@/types/locale";
import type { Metadata } from "next";

type BinStoresProps = Readonly<{ params: LocaleProps }>;
export async function generateMetadata({
  params: { lang },
}: Readonly<{
  params: LocaleProps;
}>): Promise<Metadata> {
  const {
    dashboard: {
      user: {
        bin: { meta: c },
      },
    },
  } = await getDictionary(lang);

  return {
    title: c?.["title"],
  };
}
export default async function BinStores({ params: { lang } }: BinStoresProps) {
  const dic = await getDictionary(lang);
  const user = (await getAuth())?.["user"]!;

  const stores = await db.store.findMany({
    where: {
      userId: user?.["id"],
      deletedAt: { not: null },
    },
  });

  return <BinStoresTable dic={dic} data={stores} />;
}
