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
import { updateOrder } from "@/servers/orders";
import { Dictionary } from "@/types/locale";
import { orderUpdateSchema } from "@/validations/orders";
import { Order, OrderProductDetails } from "@prisma/client";
import { toast } from "sonner";
import { ResponsiveDialog } from "./responsive-dialog";

type OrderUpdateButtonProps = {
  order: Order & { products: OrderProductDetails[] };
} & ButtonProps &
  Dictionary["order-update-button"] &
  Dictionary["order-form"] &
  Dictionary["responsive-dialog"];

export function OrderUpdateButton({
  dic: { "order-update-button": c, ...dic },
  order,
  children,
  disabled,
  ...props
}: OrderUpdateButtonProps) {
  const lang = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(disabled ?? false);
  const [open, setOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof orderUpdateSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(orderUpdateSchema),
    defaultValues: { ...order },
  });

  async function onSubmit(data: z.infer<typeof orderUpdateSchema>) {
    await toastPromise(async () => await updateOrder(data), setLoading, lang);

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
      title={c?.["update order"]}
      description={
        c?.[
          "updating a order allows you to refine and enhance the details of your ongoing developments"
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
      {/* <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <OrderForm.name dic={dic} form={form} loading={loading} />
        </form>
      </Form> */}
    </ResponsiveDialog>
  );
}
