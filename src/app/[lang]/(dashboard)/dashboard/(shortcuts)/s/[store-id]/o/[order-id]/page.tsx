import { Metadata } from "next";

import { getDictionary } from "@/lib/dictionaries";
import { LocaleProps } from "@/types/locale";

import { DashboardLayout } from "@/components/dashboard-layout";

import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { OrderBinButton } from "@/components/order-bin-button";
import { OrderRestoreButton } from "@/components/order-restore-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";

type OrderProps = Readonly<{
  params: { "store-id": string; "order-id": string } & LocaleProps;
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

export default async function Order({
  params: { lang, "store-id": storeId, "order-id": orderId },
}: OrderProps) {
  const dic = await getDictionary(lang);
  const c = dic?.["dashboard"]?.["user"]?.["stores"]?.["orders"]?.["order"];
  const user = (await getAuth())?.["user"]!;

  const order = await db.order.findFirst({
    include: { store: { select: { name: true, deletedAt: true } } },
    where: {
      id: orderId,
      store: {
        id: storeId,
        userId: user?.["id"],
      },
    },
  });
  if (!order) return <div>NO ORDER</div>;
  const storeDeleted = !!order?.["store"]?.["deletedAt"];
  const orderDeleted = !!order?.["deletedAt"];

  return (
    <DashboardLayout>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/s/${storeId}`}
            className={buttonVariants({ variant: "ghost" })}
          >
            <Icons.chevronLeft />
            back to{" "}
            <span className="font-semibold">{order?.["store"]?.["name"]} </span>
          </Link>
        </div>

        <div>
          {orderDeleted ? (
            <OrderRestoreButton
              dic={dic}
              order={order}
              disabled={storeDeleted}
            />
          ) : (
            <OrderBinButton dic={dic} order={order} disabled={storeDeleted} />
          )}
        </div>
      </div>

      {(storeDeleted || orderDeleted) && (
        <Alert variant="warning" className="my-6">
          <Icons.exclamationTriangle />
          <AlertTitle>{c?.["warning!"]}</AlertTitle>
          <AlertDescription>
            {
              c?.[
                storeDeleted
                  ? "its store is deleted, once you restore it all will be editable."
                  : "this order is deleted, once you restore it all will be editable."
              ]
            }
          </AlertDescription>
        </Alert>
      )}
      <DashboardLayout.Header>
        <div>
          <DashboardLayout.Title>{order?.["id"]}</DashboardLayout.Title>
          <DashboardLayout.Description>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit.
          </DashboardLayout.Description>
        </div>
      </DashboardLayout.Header>
      {/* <OrdersTable dic={dic} data={orders} /> */}
    </DashboardLayout>
  );
}
