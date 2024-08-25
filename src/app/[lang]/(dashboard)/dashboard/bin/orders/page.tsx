import { BinOrdersTable } from "@/components/bin-orders-table";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDictionary } from "@/lib/dictionaries";
import { LocaleProps } from "@/types/locale";
import type { Metadata } from "next";

type BinOrdersProps = Readonly<{ params: LocaleProps }>;
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
export default async function BinOrders({ params: { lang } }: BinOrdersProps) {
  const dic = await getDictionary(lang);
  const user = (await getAuth())?.["user"]!;

  const orders = await db.order.findMany({
    where: {
      store: { userId: user?.["id"] },
      deletedAt: { not: null },
    },
  });

  return <BinOrdersTable dic={dic} data={orders} />;
}
