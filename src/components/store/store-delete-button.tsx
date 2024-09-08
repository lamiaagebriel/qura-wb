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
import { deleteStore } from "@/servers/stores";
import { Dictionary } from "@/types/locale";
import { storeDeleteSchema } from "@/validations/stores";
import { Store } from "@prisma/client";
import { toast } from "sonner";

type StoreDeleteButtonProps = {
  store: Store;
} & ButtonProps &
  Dictionary["store-delete-button"] &
  Dictionary["store-form"] &
  Dictionary["responsive-dialog"];

export function StoreDeleteButton({
  dic: { "store-delete-button": c, ...dic },
  store,
  children,
  disabled,
  ...props
}: StoreDeleteButtonProps) {
  const lang = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(disabled ?? false);
  const [open, setOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof storeDeleteSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(storeDeleteSchema),
    defaultValues: { ...store },
  });

  async function onSubmit(data: z.infer<typeof storeDeleteSchema>) {
    await toastPromise(
      async () => await deleteStore({ ...data }),
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
      title={c?.["delete store"]}
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
              className="w-full md:w-fit"
              disabled={loading}
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
