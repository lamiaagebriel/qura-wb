import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";

import { queries } from "@/servers/db/queries";
import { getDictionary } from "@/servers/locale";
import { updateProduct } from "@/servers/products";
import { getAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ProductStatus } from "@/lib/validations";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormButton,
  FormInputField,
  FormResetButton,
  FormSelectField,
  FormTextareaField,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import {
  EmptyPlaceholder,
  EmptyPlaceholderDescription,
  EmptyPlaceholderIcon,
  EmptyPlaceholderTitle,
} from "@/components/empty-placeholder";
import { Icons } from "@/components/icons";
import { Image } from "@/components/image";
import { Link } from "@/components/link";
import { ProductImageManager } from "@/components/product-images-manager";

type ProductProps = Readonly<{
  params: Promise<{ "store-id": string; "product-id": string }>;
}>;
export const metadata: Metadata = { title: "Product" };
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
              stock: String(selectedProduct?.stock),
              oldValues: { ...selectedProduct },
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
                <span className="sr-only">{cmn?.["back"]}</span>
              </Link>

              <h1 className="flex-1 text-xl font-semibold tracking-tight">
                {c?.["product details"]}
              </h1>
              <Badge variant="outline">
                {pp?.["status"]?.["enums"]?.[selectedProduct?.status]?.label}
              </Badge>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <div className="flex items-center gap-2">
                <FormResetButton variant="outline" size="sm">
                  {cmn?.["discard"]}
                </FormResetButton>
                <FormButton type="submit" size="sm">
                  {cmn?.["save changes"]}
                </FormButton>
              </div>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-[1fr,250px] lg:grid-cols-3 lg:gap-4">
            <div className="grid auto-rows-max items-start gap-2 lg:col-span-2 lg:gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                    {c?.["product details"]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <FormInputField
                      field={{ name: "title" }}
                      label={pp?.["title"]?.["title"]}
                      // placeholder={cmn?.["title"]?.["joe doe"]}
                    />
                    <FormInputField
                      field={{ name: "slug" }}
                      label={pp?.["slug"]?.["slug"]}
                    />

                    <FormTextareaField
                      field={{ name: "description" }}
                      label={pp?.["description"]?.["description"]}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                    {c?.["product cost"]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <FormInputField
                      type="number"
                      field={{ name: "cost" }}
                      label={pp?.["cost"]?.["cost"]}
                      // placeholder={cmn?.["cost"]?.["joe doe"]}
                    />
                    <FormInputField
                      type="number"
                      field={{ name: "price" }}
                      label={pp?.["price"]?.["price"]}
                      // placeholder={cmn?.["price"]?.["joe doe"]}
                    />
                    <FormInputField
                      type="number"
                      field={{ name: "discount" }}
                      label={pp?.["discount"]?.["discount"]}
                      // placeholder={cmn?.["discount"]?.["joe doe"]}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid auto-rows-max items-start gap-2 lg:gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                    {c?.["product status"]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <FormSelectField
                      field={{ name: "status" }}
                      label={{
                        className: "sr-only",
                        children: pp?.["status"]?.["status"],
                      }}
                      placeholder={pp?.["status"]?.["select status..."]}
                      items={(
                        Object.keys(
                          pp?.["status"]?.["enums"]
                        ) as ProductStatus[]
                      )?.map((key) => ({
                        value: key,
                        children: pp?.["status"]?.["enums"]?.[key]?.label ?? "",
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                    {c?.["product images"]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <ProductImageManager />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                    {c?.["stock"]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <FormInputField
                      type="number"
                      field={{ name: "stock" }}
                      label={{
                        className: "sr-only",
                        children: pp?.["stock"]?.["stock"],
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 md:hidden">
            <div className="flex items-center gap-2">
              <FormResetButton variant="outline" size="sm">
                {cmn?.["discard"]}
              </FormResetButton>
              <FormButton type="submit" size="sm">
                {cmn?.["save changes"]}
              </FormButton>
            </div>
          </div>
        </Form>
      </div>
    </main>
  );
}
