import { Metadata } from "next";

import { getDictionary } from "@/lib/dictionaries";
import { LocaleProps } from "@/types/locale";

import { DashboardLayout } from "@/components/dashboard-layout";

import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { ProductsTable } from "@/components/products-table";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";

type StoreProps = Readonly<{
  params: { "store-id": string } & LocaleProps;
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

export default async function Store({
  params: { lang, "store-id": storeId },
}: StoreProps) {
  const dic = await getDictionary(lang);
  const c = dic?.["dashboard"]?.["user"]?.["stores"];

  const store = await db.store.findFirst({
    where: {
      id: storeId,
      deletedAt: null,
    },
  });
  if (!store) return <div>NO STORE</div>;
  const products = await db.product.findMany({
    where: {
      storeId,
      deletedAt: null,
    },
  });

  return (
    <DashboardLayout>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <Link href="/stores" className={buttonVariants({ variant: "ghost" })}>
            <Icons.chevronLeft />
            {c?.["back to all stores"]}
          </Link>
        </div>
      </div>

      <DashboardLayout.Header>
        <div>
          <DashboardLayout.Title>{store?.["name"]}</DashboardLayout.Title>
          <DashboardLayout.Description>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit.
          </DashboardLayout.Description>
        </div>
      </DashboardLayout.Header>
      <ProductsTable
        dic={dic}
        data={products.map((p) => ({
          ...p,
          store: { deletedAt: store?.["deletedAt"] },
        }))}
      />
    </DashboardLayout>
  );
}
