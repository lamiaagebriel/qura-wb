import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";

import { queries } from "@/servers/db/queries";
import { getDictionary } from "@/servers/locale";
import { updateProduct } from "@/servers/products";
import { getAuth } from "@/lib/auth";
import { cn, formatDate } from "@/lib/utils";
import { ProductStatus } from "@/lib/validations";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, DataTableProvider } from "@/components/ui/data-table";
import {
  Form,
  FormButton,
  FormInputField,
  FormResetButton,
  FormSelectField,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import {
  EmptyPlaceholder,
  EmptyPlaceholderDescription,
  EmptyPlaceholderIcon,
  EmptyPlaceholderTitle,
} from "@/components/empty-placeholder";
import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { ProductCreateButton } from "@/components/product-create-button";
import { StoreCreateButton } from "@/components/store-create-button";

type ProductProps = Readonly<{
  params: Promise<{ "store-id": string; "product-id": string }>;
}>;
export const metadata: Metadata = { title: "Product" };
export default async function Product({ params }: ProductProps) {
  const { "store-id": storeId, "product-id": productId } = await params;

  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const dic = await getDictionary();
  const c = dic?.["stores"]?.["store"]?.["products"];
  const pp = dic?.["db"]?.["products"];
  const cmn = dic?.["cmn"];

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
                <span>جميع المسوقيين بالعمولة</span>
              </Link>
            </EmptyPlaceholder>
          </div>
        </div>
      </main>
    );

  return (
    <main className="flex-1">
      <div className="container flex flex-1 flex-col py-6">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                <Icons.shirt className="size-5" />
                {c?.["products"]}
              </h2>
              <p className="max-w-prose text-sm text-muted-foreground">
                {c?.["browse all products, edit, and filter."]}
              </p>
            </div>
          </div>

          <Separator className="my-4" />
        </div>
      </div>

      <div className="container py-4">
        <Form
          validation="update-product"
          onSubmit={updateProduct}
          useForm={{
            defaultValues: { ...selectedProduct },
          }}
        >
          <main className="flex flex-col gap-4">
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
                  بيانات المُنتج
                </h1>
                {/* <Badge variant="outline">
                {enums?.["user-status"]?.[user?.status]?.label}
              </Badge> */}
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
                      بيانات المُنتج
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <FormInputField
                        field={{ name: "title" }}
                        label={pp?.["title"]?.["title"]}
                        // placeholder={cmn?.["title"]?.["joe doe"]}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid auto-rows-max items-start gap-2 lg:gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                      حالة الحساب
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      <FormSelectField
                        field={{ name: "status" }}
                        label={pp?.["status"]?.["status"]}
                        placeholder={pp?.["status"]?.["select status..."]}
                        items={(
                          Object.keys(
                            pp?.["status"]?.["enums"]
                          ) as ProductStatus[]
                        )?.map((key) => ({
                          value: key,
                          children:
                            pp?.["status"]?.["enums"]?.[key]?.label ?? "",
                        }))}
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
          </main>
        </Form>
      </div>
    </main>
  );
}
