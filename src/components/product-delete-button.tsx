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
import { deleteProduct } from "@/servers/products";
import { Dictionary } from "@/types/locale";
import { productDeleteSchema } from "@/validations/products";
import { Product } from "@prisma/client";
import { toast } from "sonner";
import { ResponsiveDialog } from "./responsive-dialog";

type ProductDeleteButtonProps = {
  product: Product;
} & ButtonProps &
  Dictionary["product-delete-button"] &
  Dictionary["product-form"] &
  Dictionary["responsive-dialog"];

export function ProductDeleteButton({
  dic: { "product-delete-button": c, ...dic },
  product,
  children,
  disabled,
  ...props
}: ProductDeleteButtonProps) {
  const lang = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(disabled ?? false);
  const [open, setOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof productDeleteSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(productDeleteSchema),
    defaultValues: { ...product },
  });

  async function onSubmit(data: z.infer<typeof productDeleteSchema>) {
    await toastPromise(
      async () => await deleteProduct({ ...data }),
      setLoading,
      lang
    );

    router.refresh();
    form.reset();
    setOpen(false);
    toast.success(c?.["deleted successfully."]);
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
          "once deleted, this action cannot be undone. please be certain, as all relevant data will be permanently deleted."
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
          <Button disabled={disabled ?? loading} {...props}>
            {c?.["delete"]}
          </Button>
        )
      }
    />
  );
}
