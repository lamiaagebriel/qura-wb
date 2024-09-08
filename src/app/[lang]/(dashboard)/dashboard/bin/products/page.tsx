import { BinProductsTable } from "@/components/product/bin-products-table";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDictionary } from "@/lib/dictionaries";
import { LocaleProps } from "@/types/locale";
import type { Metadata } from "next";

type BinProductsProps = Readonly<{ params: LocaleProps }>;
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
export default async function BinProducts({
  params: { lang },
}: BinProductsProps) {
  const dic = await getDictionary(lang);
  const user = (await getAuth())?.["user"]!;

  const products = await db.product.findMany({
    where: {
      store: { userId: user?.["id"] },
      deletedAt: { not: null },
    },
  });

  return <BinProductsTable dic={dic} data={products} />;
}
