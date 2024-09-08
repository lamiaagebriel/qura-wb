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
import { StoreForm } from "@/components/store/store-form";
import { useLocale } from "@/hooks/use-locale";
import { toastPromise } from "@/lib/utils";
import { updateStore } from "@/servers/stores";
import { Dictionary } from "@/types/locale";
import { storeUpdateSchema } from "@/validations/stores";
import { Store } from "@prisma/client";
import { toast } from "sonner";

type StoreUpdateButtonProps = {
  store: Store;
} & ButtonProps &
  Dictionary["store-update-button"] &
  Dictionary["store-form"] &
  Dictionary["responsive-dialog"];

export function StoreUpdateButton({
  dic: { "store-update-button": c, ...dic },
  store,
  children,
  disabled,
  ...props
}: StoreUpdateButtonProps) {
  const lang = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(disabled ?? false);
  const [open, setOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof storeUpdateSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(storeUpdateSchema),
    defaultValues: { ...store },
  });

  async function onSubmit(data: z.infer<typeof storeUpdateSchema>) {
    await toastPromise(async () => await updateStore(data), setLoading, lang);

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
      title={c?.["update store"]}
      description={
        c?.[
          "updating a store allows you to refine and enhance the details of your ongoing developments"
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <StoreForm.name dic={dic} form={form} loading={loading} />
        </form>
      </Form>
    </ResponsiveDialog>
  );
}
