"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useRouter } from "next/navigation";

import { useLocale } from "@/hooks/use-locale";
import { toastPromise } from "@/lib/utils";
import { createProduct } from "@/servers/products";
import { Dictionary } from "@/types/locale";
import { productCreateSchema } from "@/validations/products";
import { Product } from "@prisma/client";
import { toast } from "sonner";
import { ProductForm } from "./product-form";
import { ResponsiveDialog, ResponsiveDialogProps } from "./responsive-dialog";

type ProductCreateButtonProps = {
  product: Pick<Product, "storeId">;
  children: Pick<ResponsiveDialogProps, "trigger">["trigger"];
} & Dictionary["product-create-button"] &
  Dictionary["product-form"] &
  Dictionary["responsive-dialog"];

export function ProductCreateButton({
  dic: { "product-create-button": c, ...dic },
  product,
  children,
}: ProductCreateButtonProps) {
  const lang = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof productCreateSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(productCreateSchema),
    defaultValues: { ...product },
  });
  console.log(form.formState.errors);
  async function onSubmit(data: z.infer<typeof productCreateSchema>) {
    await toastPromise(async () => await createProduct(data), setLoading, lang);

    router.refresh();
    form.reset();
    setOpen(false);
    toast.success(c?.["created successfully."]);
  }

  return (
    <ResponsiveDialog
      dic={dic}
      open={open}
      setOpen={setOpen}
      disabled={loading}
      title={c?.["create product"]}
      description={
        c?.[
          "by providing detailed information about your product, you'll be able to streamline your operations, track progress, and ensure that all stakeholders are informed about the development's key aspects and milestones."
        ]
      }
      confirm={
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Button disabled={loading} className="w-full md:w-fit">
              {loading && <Icons.spinner />}
              {c?.["submit"]}
            </Button>
          </form>
        </Form>
      }
      trigger={children}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <ProductForm.name dic={dic} form={form} loading={loading} />
        </form>
      </Form>
    </ResponsiveDialog>
  );
}
