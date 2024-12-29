import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";

import { queries } from "@/servers/db/queries";
import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

import { Avatar } from "@/components/ui/avatar";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  EmptyPlaceholder,
  EmptyPlaceholderDescription,
  EmptyPlaceHolderIcon,
  EmptyPlaceholderTitle,
} from "@/components/empty-placeholder";
import { Link } from "@/components/link";
import { ProductCreateButton } from "@/components/product-create-button";
import { StoreCreateButton } from "@/components/store-create-button";

type ProductsProps = Readonly<{ params: Promise<{ "store-id": string }> }>;
export const metadata: Metadata = { title: "Products" };
export default async function Products({ params }: ProductsProps) {
  const { "store-id": storeId } = await params;

  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const dic = await getDictionary();
  const c = dic?.["stores"]?.["store"]?.["products"];

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
                {c?.["products"]}
              </h2>
              <p className="max-w-prose text-sm text-muted-foreground">
                {c?.["browse all products, edit, and filter."]}
              </p>
            </div>

            <div>
              {!!products?.length && (
                <ProductCreateButton store={selectedStore} />
              )}
            </div>
          </div>

          <Separator className="my-4" />
        </div>
      </div>

      <div className="container">
        {products?.length ? (
          <div className="container grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((e, i) => (
              <Card key={i}>
                <Link href={`/ss/${e?.id}`}>
                  <CardHeader className="flex flex-row items-start gap-2">
                    <div className="w-full">
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="line-clamp-1">
                          {e?.title}
                        </CardTitle>

                        <CardDescription className="whitespace-nowrap text-xs">
                          {formatDate(e?.createdAt, { type: "distance" })}
                        </CardDescription>
                      </div>
                      <CardDescription className="line-clamp-1 max-w-prose text-xs">
                        {e?.description}
                      </CardDescription>
                      <CardDescription className="line-clamp-1 max-w-prose">
                        {e?.barcode}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyPlaceholder>
            <EmptyPlaceHolderIcon name="inbox" />
            <EmptyPlaceholderTitle>No items yet</EmptyPlaceholderTitle>
            <EmptyPlaceholderDescription>
              Get started by creating your first item. <br />
              You can add as many as you need.
            </EmptyPlaceholderDescription>

            <ProductCreateButton store={selectedStore} />
          </EmptyPlaceholder>
        )}
      </div>
    </main>
  );
}
