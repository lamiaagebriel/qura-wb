"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Icons } from "@/components/icons";
import { Button, ButtonProps } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useRouter } from "next/navigation";

import { ProductForm } from "@/components/product/product-form";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { useLocale } from "@/hooks/use-locale";
import { toastPromise } from "@/lib/utils";
import { updateProduct } from "@/servers/products";
import { Dictionary } from "@/types/locale";
import { productUpdateSchema } from "@/validations/products";
import { Product } from "@prisma/client";
import { toast } from "sonner";

type ProductUpdateButtonProps = {
  product: Product;
} & ButtonProps &
  Dictionary["product-update-button"] &
  Dictionary["product-form"] &
  Dictionary["responsive-dialog"];

export function ProductUpdateButton({
  dic: { "product-update-button": c, ...dic },
  product,
  children,
  disabled,
  ...props
}: ProductUpdateButtonProps) {
  const lang = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(disabled ?? false);
  const [open, setOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof productUpdateSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(productUpdateSchema),
    defaultValues: { ...product },
  });

  async function onSubmit(data: z.infer<typeof productUpdateSchema>) {
    await toastPromise(async () => await updateProduct(data), setLoading, lang);

    router.refresh();
    form.reset();
    setOpen(false);
    toast.success(c?.["updated successfully."]);
  }

  return (
    <ResponsiveDialog
      dic={dic}
      open={open}
      setOpen={setOpen}
      disabled={loading}
      title={c?.["update product"]}
      description={
        c?.[
          "updating a product allows you to refine and enhance the details of your ongoing developments"
        ]
      }
      confirm={
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Button disabled={loading} className="w-full md:w-fit">
              {!disabled && loading && <Icons.spinner />}
              {c?.["submit"]}
            </Button>
          </form>
        </Form>
      }
      trigger={
        children ?? (
          <Button disabled={disabled ?? loading} {...props}>
            {c?.["edit"]}
          </Button>
        )
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <ProductForm.name dic={dic} form={form} loading={loading} />
        </form>
      </Form>
    </ResponsiveDialog>
  );
}
