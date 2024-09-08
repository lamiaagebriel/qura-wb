import { Metadata } from "next";

import { getDictionary } from "@/lib/dictionaries";
import { LocaleProps } from "@/types/locale";

import { DashboardLayout } from "@/components/dashboard-layout";

import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { ProductRestoreButton } from "@/components/product/product-restore-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";

type ProductProps = Readonly<{
  params: { "store-id": string; "product-id": string } & LocaleProps;
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

export default async function Product({
  params: { lang, "store-id": storeId, "product-id": productId },
}: ProductProps) {
  const dic = await getDictionary(lang);
  const c = dic?.["dashboard"]?.["user"]?.["stores"]?.["products"]?.["product"];
  const user = (await getAuth())?.["user"]!;

  const product = await db.product.findFirst({
    include: { store: { select: { name: true, deletedAt: true } } },
    where: {
      id: productId,
      store: {
        id: storeId,
        userId: user?.["id"],
      },
    },
  });
  if (!product) return <div>NO PRODUCT</div>;
  const storeDeleted = !!product?.["store"]?.["deletedAt"];
  const productDeleted = !!product?.["deletedAt"];

  return (
    <DashboardLayout>
      <div className="mb-4">
        <Link
          href={`/dashboard/s/${storeId}`}
          className={buttonVariants({ variant: "ghost" })}
        >
          <Icons.chevronLeft />
          {c?.["back to"]}{" "}
          <span className="font-semibold">{product?.["store"]?.["name"]} </span>
        </Link>
      </div>

      {(storeDeleted || productDeleted) && (
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
                    storeDeleted
                      ? "its store is deleted, once you restore it all will be editable."
                      : "this product is deleted, once you restore it all will be editable."
                  ]
                }
              </AlertDescription>
            </div>
          </div>

          <ProductRestoreButton
            dic={dic}
            product={product}
            disabled={storeDeleted}
          />
        </Alert>
      )}
      <DashboardLayout.Header>
        <div>
          <DashboardLayout.Title>{product?.["name"]}</DashboardLayout.Title>
          <DashboardLayout.Description>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit.
          </DashboardLayout.Description>
        </div>
      </DashboardLayout.Header>
      {/* <ProductsTable dic={dic} data={products} /> */}
    </DashboardLayout>
  );
}
