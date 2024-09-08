import { Metadata } from "next";

import { getDictionary } from "@/lib/dictionaries";
import { LocaleProps } from "@/types/locale";

import { DashboardLayout } from "@/components/dashboard-layout";

import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { OrderCreateButton } from "@/components/order/order-create-button";
import { OrdersTable } from "@/components/order/orders-table";
import { ProductCreateButton } from "@/components/product/product-create-button";
import { ProductsTable } from "@/components/product/products-table";
import { StoreRestoreButton } from "@/components/store/store-restore-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    include: {
      products: {
        include: {
          orders: {
            include: { order: { select: { id: true } } },
            where: {
              order: { deletedAt: null },
            },
          },
        },
        where: { deletedAt: null },
      },
      orders: {
        include: {
          products: {
            include: { product: { select: { name: true, deletedAt: true } } },
          },
        },
        where: { deletedAt: null },
      },
    },
    where: {
      id: storeId,
      userId: user?.["id"],
    },
  });
  if (!store) return <div>NO STORE</div>;

  const products = store?.["products"];
  const orders = store?.["orders"];

  const storeDeleted = !!store?.["deletedAt"];

  return (
    <DashboardLayout>
      <div className="mb-4">
        <Link
          href="/dashboard/stores"
          className={buttonVariants({ variant: "ghost" })}
        >
          <Icons.chevronLeft />
          {c?.["back to all stores"]}
        </Link>
      </div>

      {storeDeleted && (
        <Alert
          variant="warning"
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-start gap-2">
            <Icons.exclamationTriangle />

            <div>
              <AlertTitle>{c?.["warning!"]}</AlertTitle>
              <AlertDescription>
                {
                  c?.[
                    "this store is deleted, once you restore it all will be editable."
                  ]
                }
              </AlertDescription>
            </div>
          </div>

          <StoreRestoreButton dic={dic} store={store} />
        </Alert>
      )}
      <DashboardLayout.Header>
        <div>
          <DashboardLayout.Title>{store?.["name"]}</DashboardLayout.Title>
          <DashboardLayout.Description>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit.
          </DashboardLayout.Description>
        </div>
      </DashboardLayout.Header>
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductCreateButton
            dic={dic}
            product={{ storeId }}
            disabled={storeDeleted}
          />

          <ProductsTable
            dic={dic}
            data={products.map((p) => ({
              ...p,
              store: { deletedAt: store?.["deletedAt"] },
            }))}
          />
        </TabsContent>
        <TabsContent value="orders">
          {products?.["length"] ? (
            <OrderCreateButton
              dic={dic}
              order={{ storeId }}
              product={products?.["0"]}
              disabled={storeDeleted}
            />
          ) : null}
          <OrdersTable
            dic={dic}
            data={orders.map((o) => ({
              ...o,
              store: { deletedAt: store?.["deletedAt"] },
            }))}
          />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
