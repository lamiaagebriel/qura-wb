import { Metadata } from "next";

import { getDictionary } from "@/lib/dictionaries";
import { LocaleProps } from "@/types/locale";

import { DashboardLayout } from "@/components/dashboard-layout";

import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { ProductCreateButton } from "@/components/product-create-button";
import { ProductsTable } from "@/components/products-table";
import { Button, buttonVariants } from "@/components/ui/button";
import { getAuth } from "@/lib/auth";
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
  const user = (await getAuth())?.["user"]!;

  const store = await db.store.findFirst({
    where: {
      id: storeId,
      userId: user?.["id"],
      deletedAt: null,
    },
  });
  if (!store) return <div>NO STORE</div>;
  const products = await db.product.findMany({
    where: {
      storeId,
      deletedAt: null,
      store: { userId: user?.["id"] },
    },
  });
  return (
    <DashboardLayout>
      <div>
        <Link
          href="/dashboard/stores"
          className={buttonVariants({ variant: "ghost" })}
        >
          <Icons.chevronLeft />
          back to all stores
        </Link>
      </div>

      <DashboardLayout.Header>
        <div>
          <DashboardLayout.Title>{store?.["name"]}</DashboardLayout.Title>
          <DashboardLayout.Description>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit.
          </DashboardLayout.Description>
        </div>

        <div>
          <ProductCreateButton dic={dic} product={{ storeId }}>
            <Button>Create Product</Button>
          </ProductCreateButton>
        </div>
      </DashboardLayout.Header>
      <ProductsTable dic={dic} data={products} />
    </DashboardLayout>
  );
}
