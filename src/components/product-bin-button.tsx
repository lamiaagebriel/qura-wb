"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Icons } from "@/components/icons";
import { Button, ButtonProps } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useRouter } from "next/navigation";

import { useLocale } from "@/hooks/use-locale";
import { toastPromise } from "@/lib/utils";
import { updateProduct } from "@/servers/products";
import { Dictionary } from "@/types/locale";
import { productBinSchema } from "@/validations/products";
import { Product } from "@prisma/client";
import { toast } from "sonner";
import { ResponsiveDialog } from "./responsive-dialog";

type ProductBinButtonProps = {
  product: Product;
} & ButtonProps &
  Dictionary["product-bin-button"] &
  Dictionary["product-form"] &
  Dictionary["responsive-dialog"];

export function ProductBinButton({
  dic: { "product-bin-button": c, ...dic },
  product,
  disabled,
  children,
  ...props
}: ProductBinButtonProps) {
  const lang = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(disabled ?? false);
  const [open, setOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof productBinSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(productBinSchema),
    defaultValues: { ...product, deletedAt: new Date() },
  });

  async function onSubmit(data: z.infer<typeof productBinSchema>) {
    await toastPromise(
      async () => await updateProduct({ ...data, deletedAt: new Date() }),
      setLoading,
      lang
    );

    router.refresh();
    form.reset();
    setOpen(false);
    toast.success(c?.["moved to bin."]);
  }

  return (
    <ResponsiveDialog
      dic={dic}
      open={open}
      setOpen={setOpen}
      disabled={loading}
      title={c?.["delete product"]}
      description={
        c?.[
          "once deleted, the product will be moved to the bin. you can manually delete it or it will be automatically removed after 30 days. if reproductd, everything will be reinstated as if nothing happened."
        ]
      }
      confirm={
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Button
              variant="destructive"
              disabled={loading}
              className="w-full md:w-fit"
            >
              {!disabled && loading && <Icons.spinner />}
              {c?.["delete"]}
            </Button>
          </form>
        </Form>
      }
      trigger={
        children ?? (
          <Button
            variant="destructive"
            disabled={disabled ?? loading}
            {...props}
          >
            {c?.["delete"]}
          </Button>
        )
      }
    />
  );
}
