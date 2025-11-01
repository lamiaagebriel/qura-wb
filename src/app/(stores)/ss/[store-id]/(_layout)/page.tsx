import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants";

import { queries } from "@/db/queries";
import { getAuth } from "@/lib/auth";
import { getDictionary } from "@/servers/locale";

import {
  EmptyPlaceholder,
  EmptyPlaceholderDescription,
  EmptyPlaceholderIcon,
  EmptyPlaceholderTitle,
} from "@/components/empty-placeholder";
import { ProductCard } from "@/components/product-card";
import { ProductCreateButton } from "@/components/product-create-button";
import { Separator } from "@/components/ui/separator";

type ProductsProps = Readonly<{ params: Promise<{ "store-id": string }> }>;
export const metadata: Metadata = { title: "Products" };
export default async function Products({ params }: ProductsProps) {
  const { "store-id": storeId } = await params;

  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const dic = await getDictionary();
  const c = dic["dashboard"]["store-id"]["products"];

  const { data: selectedStore } = await queries.stores.get({ id: storeId });
  if (!selectedStore) return <div>NO STORE</div>;

  const { data: products } = await queries.products.getMany({
    storeId: selectedStore?.id,
    status: "active",
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
          </div>

          <Separator className="my-4" />
        </div>
      </div>

      {products?.length ? (
        <div className="container grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products?.map((e, i) => (
            <ProductCard key={i} product={e} />
          ))}
        </div>
      ) : (
        <div className="container">
          <EmptyPlaceholder>
            <EmptyPlaceholderIcon name="inbox" />
            <EmptyPlaceholderTitle>
              {c["no products found"]}
            </EmptyPlaceholderTitle>
            <EmptyPlaceholderDescription>
              {c["there are no products in this store."]}
            </EmptyPlaceholderDescription>
            {selectedStore?.ownerId === user?.id ? (
              <ProductCreateButton store={selectedStore} />
            ) : null}
          </EmptyPlaceholder>
        </div>
      )}
    </main>
  );
}
