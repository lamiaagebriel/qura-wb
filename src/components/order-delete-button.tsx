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
import { deleteOrder } from "@/servers/orders";
import { Dictionary } from "@/types/locale";
import { orderDeleteSchema } from "@/validations/orders";
import { Order } from "@prisma/client";
import { toast } from "sonner";
import { ResponsiveDialog } from "./responsive-dialog";

type OrderDeleteButtonProps = {
  order: Order;
} & ButtonProps &
  Dictionary["order-delete-button"] &
  Dictionary["order-form"] &
  Dictionary["responsive-dialog"];

export function OrderDeleteButton({
  dic: { "order-delete-button": c, ...dic },
  order,
  children,
  disabled,
  ...props
}: OrderDeleteButtonProps) {
  const lang = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(disabled ?? false);
  const [open, setOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof orderDeleteSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(orderDeleteSchema),
    defaultValues: { ...order },
  });

  async function onSubmit(data: z.infer<typeof orderDeleteSchema>) {
    await toastPromise(
      async () => await deleteOrder({ ...data }),
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
      title={c?.["delete order"]}
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
