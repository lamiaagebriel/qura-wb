import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";

import { queries } from "@/servers/db/queries";
import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";

import { Card } from "@/components/ui/card";
import { DataTable, DataTableProvider } from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";
import { ProductCreateButton } from "@/components/product-create-button";

import { columns } from "./columns";

type ProductsProps = Readonly<{ params: Promise<{ "store-id": string }> }>;
export const metadata = async (): Promise<Metadata> => {
  const dic = await getDictionary();
  const c = dic["stores"]["store"]["products"];

  return { title: c["products"] };
};
export default async function Products({ params }: ProductsProps) {
  const { "store-id": storeId } = await params;

  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const dic = await getDictionary();
  const c = dic["stores"]["store"]["products"];

  const { data: selectedStore } = await queries.stores.get({ id: storeId });
  if (!selectedStore) return <div>NO STORE</div>;

  const { data: products } = await queries.products.getMany({
    storeId: selectedStore?.id,
  });
  return (
    <main className="flex-1">
      <div className="container flex flex-1 flex-col py-6">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                {c["products"]}
              </h2>
              <p className="max-w-prose text-sm text-muted-foreground">
                {c["create, browse, edit, and filter all products easily."]}
              </p>
            </div>

            <div>
              <ProductCreateButton store={selectedStore} />
            </div>
          </div>

          <Separator className="my-4" />
        </div>
      </div>

      <div className="container">
        <DataTableProvider data={products} columns={columns}>
          <Card className="p-0">
            <DataTable />
          </Card>
          {/* <DataTablePagination
                    totalItems={
                      tabs?.find((e) => e?.value === "ALL")?.total ??
                      links?.length
                    }
                  /> */}
        </DataTableProvider>
      </div>
    </main>
  );
}
