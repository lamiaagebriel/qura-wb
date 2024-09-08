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
import { orderRestoreSchema } from "@/validations/orders";
import { Order } from "@prisma/client";
import { toast } from "sonner";

type OrderRestoreButtonProps = {
  order: Order;
} & ButtonProps &
  Dictionary["order-restore-button"] &
  Dictionary["order-form"] &
  Dictionary["responsive-dialog"];

export function OrderRestoreButton({
  dic: { "order-restore-button": c, ...dic },
  order,
  children,
  disabled,
  ...props
}: OrderRestoreButtonProps) {
  const lang = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(disabled ?? false);
  const [open, setOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof orderRestoreSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(orderRestoreSchema),
    defaultValues: { ...order, deletedAt: new Date() },
  });

  async function onSubmit(data: z.infer<typeof orderRestoreSchema>) {
    await toastPromise(
      // @ts-ignore
      async () => await updateOrderFeature({ ...data, deletedAt: null }),
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
      title={c?.["restore order"]}
      description={
        c?.[
          "restoring this order will bring back all its data and settings, making it appear as if it was never deleted. all related information will be fully reinstated, allowing you to pick up right where you left off."
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
