"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Icons } from "@/components/icons";
import { Button, ButtonProps } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useRouter } from "next/navigation";

import { ResponsiveDialog } from "@/components/responsive-dialog";
import { useLocale } from "@/hooks/use-locale";
import { toastPromise } from "@/lib/utils";
import { updateOrderFeature } from "@/servers/orders";
import { Dictionary } from "@/types/locale";
import { orderBinSchema } from "@/validations/orders";
import { Order } from "@prisma/client";
import { toast } from "sonner";

type OrderBinButtonProps = {
  order: Order;
} & ButtonProps &
  Dictionary["order-bin-button"] &
  Dictionary["order-form"] &
  Dictionary["responsive-dialog"];

export function OrderBinButton({
  dic: { "order-bin-button": c, ...dic },
  order,
  disabled,
  children,
  ...props
}: OrderBinButtonProps) {
  const lang = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(disabled ?? false);
  const [open, setOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof orderBinSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(orderBinSchema),
    defaultValues: { ...order, deletedAt: new Date() },
  });

  async function onSubmit(data: z.infer<typeof orderBinSchema>) {
    await toastPromise(
      async () => await updateOrderFeature({ ...data, deletedAt: new Date() }),
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
      title={c?.["delete order"]}
      description={
        c?.[
          "once deleted, the order will be moved to the bin. you can manually delete it or it will be automatically removed after 30 days. if reorderd, everything will be reinstated as if nothing happened."
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
