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
import { productRestoreSchema } from "@/validations/products";
import { Product } from "@prisma/client";
import { toast } from "sonner";
import { ResponsiveDialog } from "./responsive-dialog";

type ProductRestoreButtonProps = {
  product: Product;
} & ButtonProps &
  Dictionary["product-restore-button"] &
  Dictionary["product-form"] &
  Dictionary["responsive-dialog"];

export function ProductRestoreButton({
  dic: { "product-restore-button": c, ...dic },
  product,
  children,
  disabled,
  ...props
}: ProductRestoreButtonProps) {
  const lang = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(disabled ?? false);
  const [open, setOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof productRestoreSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(productRestoreSchema),
    defaultValues: { ...product, deletedAt: new Date() },
  });

  async function onSubmit(data: z.infer<typeof productRestoreSchema>) {
    await toastPromise(
      // @ts-ignore
      async () => await updateProduct({ ...data, deletedAt: null }),
      setLoading,
      lang
    );

    router.refresh();
    form.reset();
    setOpen(false);
    toast.success(c?.["restored successfully."]);
  }

  return (
    <ResponsiveDialog
      dic={dic}
      open={open}
      setOpen={setOpen}
      disabled={loading}
      title={c?.["restore product"]}
      description={
        c?.[
          "restoring this product will bring back all its data and settings, making it appear as if it was never deleted. all related information will be fully reinstated, allowing you to pick up right where you left off."
        ]
      }
      confirm={
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Button
              variant="secondary"
              disabled={loading}
              className="w-full md:w-fit"
            >
              {!disabled && loading && <Icons.spinner />}
              {c?.["restore"]}
            </Button>
          </form>
        </Form>
      }
      trigger={
        children ?? (
          <Button disabled={disabled ?? loading} {...props}>
            {" "}
            {c?.["restore"]}
          </Button>
        )
      }
    />
  );
}
