import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";

import { queries } from "@/servers/db/queries";
import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";

import { Separator } from "@/components/ui/separator";

type OrdersProps = Readonly<{ params: Promise<{ "store-id": string }> }>;
export const metadata: Metadata = { title: "Orders" };
export default async function Orders({ params }: OrdersProps) {
  const { "store-id": storeId } = await params;

  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const dic = await getDictionary();
  const c = dic["stores"]["store"]["orders"];

  const { data: selectedStore } = await queries.stores.get({ id: storeId });
  if (!selectedStore) return <div>NO STORE</div>;

  const { data: orders } = await queries.orders.getMany({
    storeId: selectedStore?.id,
  });

  return (
    <main className="flex-1">
      <div className="container flex flex-1 flex-col py-6">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                {c["orders"]}
              </h2>
              <p className="max-w-prose text-sm text-muted-foreground">
                {c["browse all orders, edit, and filter."]}
              </p>
            </div>
          </div>

          <Separator className="my-4" />
        </div>
      </div>
      {orders?.map((e) => <div key={e?.id}>{e?.id}</div>)}
    </main>
  );
}
