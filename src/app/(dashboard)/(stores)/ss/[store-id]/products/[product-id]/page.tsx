import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";

import { queries } from "@/servers/db/queries";
import { getDictionary } from "@/servers/locale";
import { updateProduct } from "@/servers/products";
import { getAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormButton, FormResetButton } from "@/components/ui/form";
import {
  EmptyPlaceholder,
  EmptyPlaceholderDescription,
  EmptyPlaceholderIcon,
  EmptyPlaceholderTitle,
} from "@/components/empty-placeholder";
import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { ProductForm } from "@/components/product-form";

type ProductProps = Readonly<{
  params: Promise<{ "store-id": string; "product-id": string }>;
}>;
export const metadata = async (): Promise<Metadata> => {
  const dic = await getDictionary();
  const c = dic["stores"]["store"]["products"]["product"];

  return { title: c["product details"] };
};
export default async function Product({ params }: ProductProps) {
  const { "store-id": storeId, "product-id": productId } = await params;

  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const {
    stores: {
      store: {
        products: { product: c },
      },
    },
    db: { products: pp },
    cmn,
  } = await getDictionary();

  const { data: selectedProduct } = await queries.products.get({
    id: productId,
  });

  if (!selectedProduct)
    return (
      <main className="flex-1">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="container max-w-screen-sm py-4">
            <EmptyPlaceholder className="border-none">
              <EmptyPlaceholderIcon name="inbox" />
              <EmptyPlaceholderTitle>لا يوجد بيانات.</EmptyPlaceholderTitle>
              <EmptyPlaceholderDescription>
                تحاول الآن الوصول إلي بيانات غير موجودة في خوادمنا.
              </EmptyPlaceholderDescription>

              <Link
                href={`/ss/${storeId}/products`}
                className={cn(buttonVariants({ size: "lg" }))}
              >
                <Icons.shirt />
                <span>جميع المنتجات</span>
              </Link>
            </EmptyPlaceholder>
          </div>
        </div>
      </main>
    );

  return (
    <main className="flex-1">
      <div className="container py-4">
        <Form
          validation="update-product"
          onSubmit={updateProduct}
          useForm={{
            defaultValues: {
              ...selectedProduct,
              attributes: selectedProduct?.attributes ?? [],
              stock: Number(selectedProduct?.stock),
              price: Number(selectedProduct?.price),
              cost: Number(selectedProduct?.cost),
              compareToPrice: Number(selectedProduct?.compareToPrice),
              images: selectedProduct?.images ?? [],
              oldValues: {
                ...selectedProduct,
                images: selectedProduct?.images ?? [],
              },
            },
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link
                href={`/ss/${storeId}/products`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "size-7"
                )}
              >
                <Icons.chevronLeft />
                <span className="sr-only">{cmn["back"]}</span>
              </Link>

              <h1 className="flex-1 text-xl font-semibold tracking-tight">
                {c["product details"]}
              </h1>
              <Badge variant="outline">
                <div className="flex items-center gap-2">
                  <Icons.dot
                    style={{
                      backgroundColor:
                        pp["status"]["enums"][selectedProduct?.status]?.color,
                    }}
                  />
                  {pp["status"]["enums"][selectedProduct?.status]?.label}
                </div>
              </Badge>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <div className="flex items-center gap-2">
                <FormResetButton variant="outline" size="sm">
                  {cmn["discard"]}
                </FormResetButton>
                <ProductForm.delete
                  product={{
                    ...selectedProduct,
                    images: selectedProduct?.images ?? [],
                  }}
                  trigger={{ size: "sm" }}
                />
                <FormButton type="submit" size="sm">
                  {cmn["save changes"]}
                </FormButton>
              </div>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-[1fr,250px] lg:grid-cols-3 lg:gap-4">
            <div className="grid auto-rows-max items-start gap-2 lg:col-span-2 lg:gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                    {c["product details"]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <ProductForm.title />
                    <ProductForm.slug />
                    <ProductForm.description />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                    {c["product cost"]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <ProductForm.cost />
                    <div className="grid grid-cols-2 gap-2">
                      <ProductForm.price />
                      <ProductForm.compareToPrice />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                    {c["attributes"]}
                  </CardTitle>

                  <ProductForm.attributesPlusButton />
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <ProductForm.attributes />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid auto-rows-max items-start gap-2 lg:gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                    {c["product status"]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <ProductForm.status />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                    {c["product images"]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <ProductForm.images />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                    {c["stock"]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <ProductForm.stock />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 md:hidden">
            <div className="flex items-center gap-2">
              <FormResetButton variant="outline" size="sm">
                {cmn["discard"]}
              </FormResetButton>
              <ProductForm.delete
                product={{
                  ...selectedProduct,
                  images: selectedProduct?.images ?? [],
                }}
                trigger={{ size: "sm" }}
              />
              <FormButton type="submit" size="sm">
                {cmn["save changes"]}
              </FormButton>
            </div>
          </div>
        </Form>
      </div>
    </main>
  );
}
