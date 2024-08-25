import { Metadata } from "next";

import { getDictionary } from "@/lib/dictionaries";
import { LocaleProps } from "@/types/locale";

import { DashboardLayout } from "@/components/dashboard-layout";

import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { buttonVariants } from "@/components/ui/button";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";

type StoreProps = Readonly<{
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

export default async function Store({
  params: { lang, "store-id": storeId, "product-id": productId },
}: StoreProps) {
  const dic = await getDictionary(lang);
  const c = dic?.["dashboard"]?.["user"]?.["stores"]?.["products"]?.["product"];
  const user = (await getAuth())?.["user"]!;

  const product = await db.product.findFirst({
    include: { store: { select: { name: true } } },
    where: {
      id: productId,
      deletedAt: null,
      store: {
        id: storeId,
        userId: user?.["id"],
        deletedAt: null,
      },
    },
  });
  if (!product) return <div>NO PRODUCT</div>;

  return (
    <DashboardLayout>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <Link
            href={`/s/${storeId}`}
            className={buttonVariants({ variant: "ghost" })}
          >
            <Icons.chevronLeft />
            back to{" "}
            <span className="font-semibold">
              {product?.["store"]?.["name"]}{" "}
            </span>
          </Link>
        </div>
      </div>

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
