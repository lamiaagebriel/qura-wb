import { Metadata } from "next";

import { getDictionary } from "@/lib/dictionaries";
import { LocaleProps } from "@/types/locale";

import { DashboardLayout } from "@/components/dashboard-layout";

import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { OrderCreateButton } from "@/components/order-create-button";
import { OrdersTable } from "@/components/orders-table";
import { ProductCreateButton } from "@/components/product-create-button";
import { ProductsTable } from "@/components/products-table";
import { StoreBinButton } from "@/components/store-bin-button";
import { StoreRestoreButton } from "@/components/store-restore-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
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
    },
  });
  if (!store) return <div>NO STORE</div>;
  const products = await db.product.findMany({
    include: {
      orders: { include: { order: { select: { id: true } } } },
    },
    where: {
      storeId,
      deletedAt: null,
      store: { userId: user?.["id"] },
    },
  });

  const orders = await db.order.findMany({
    include: {
      products: { include: { product: { select: { name: true } } } },
    },
    where: {
      storeId,
      deletedAt: null,
      store: { userId: user?.["id"] },
    },
  });
  const storeDeleted = !!store?.["deletedAt"];

  return (
    <DashboardLayout>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/stores"
            className={buttonVariants({ variant: "ghost" })}
          >
            <Icons.chevronLeft />
            {c?.["back to all stores"]}
          </Link>
        </div>

        <div>
          {storeDeleted ? (
            <StoreRestoreButton dic={dic} store={store} />
          ) : (
            <StoreBinButton dic={dic} store={store} />
          )}
        </div>
      </div>

      {storeDeleted && (
        <Alert variant="warning" className="my-6">
          <Icons.exclamationTriangle />
          <AlertTitle>{c?.["warning!"]}</AlertTitle>
          <AlertDescription>
            {
              c?.[
                "this store is deleted, once you restore it all will be editable."
              ]
            }
          </AlertDescription>
        </Alert>
      )}
      <DashboardLayout.Header>
        <div>
          <DashboardLayout.Title>{store?.["name"]}</DashboardLayout.Title>
          <DashboardLayout.Description>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit.
          </DashboardLayout.Description>
        </div>

        <div>
          <ProductCreateButton
            dic={dic}
            product={{ storeId }}
            disabled={storeDeleted}
          />

          <OrderCreateButton
            dic={dic}
            order={{ storeId }}
            product={products?.["0"]}
            disabled={storeDeleted}
          />
        </div>
      </DashboardLayout.Header>

      <ProductsTable
        dic={dic}
        data={products.map((p) => ({
          ...p,
          store: { deletedAt: store?.["deletedAt"] },
        }))}
      />

      <OrdersTable
        dic={dic}
        data={orders.map((o) => ({
          ...o,
          store: { deletedAt: store?.["deletedAt"] },
        }))}
      />
    </DashboardLayout>
  );
}
