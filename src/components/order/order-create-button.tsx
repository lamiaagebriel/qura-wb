"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Icons } from "@/components/icons";
import { Button, ButtonProps } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useRouter } from "next/navigation";

import { OrderForm } from "@/components/order/order-form";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { useLocale } from "@/hooks/use-locale";
import { toastPromise } from "@/lib/utils";
import { createOrder } from "@/servers/orders";
import { Dictionary } from "@/types/locale";
import { orderCreateSchema } from "@/validations/orders";
import { Order, Product } from "@prisma/client";
import { toast } from "sonner";

type OrderCreateButtonProps = {
  order: Pick<Order, "storeId">;
  product: Pick<Product, "id">;
} & ButtonProps &
  Dictionary["order-create-button"] &
  Dictionary["order-form"] &
  Dictionary["responsive-dialog"];

export function OrderCreateButton({
  dic: { "order-create-button": c, ...dic },
  order,
  product,
  children,
  disabled,
  ...props
}: OrderCreateButtonProps) {
  const lang = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(disabled ?? false);
  const [open, setOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof orderCreateSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(orderCreateSchema),
    defaultValues: { ...order, products: [{ productId: product?.["id"] }] },
  });

  async function onSubmit(data: z.infer<typeof orderCreateSchema>) {
    await toastPromise(async () => await createOrder(data), setLoading, lang);

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
      title={c?.["create order"]}
      description={
        c?.[
          "by providing detailed information about your order, you'll be able to streamline your operations, track progress, and ensure that all stakeholders are informed about the development's key aspects and milestones."
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
            {c?.["create order"]}
          </Button>
        )
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <OrderForm.size dic={dic} form={form} loading={loading} />
          <OrderForm.color dic={dic} form={form} loading={loading} />
        </form>
      </Form>
    </ResponsiveDialog>
  );
}
