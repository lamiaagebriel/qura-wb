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
import { updateStore } from "@/servers/stores";
import { Dictionary } from "@/types/locale";
import { storeUpdateSchema } from "@/validations/stores";
import { Store } from "@prisma/client";
import { ResponsiveDialog, ResponsiveDialogProps } from "./responsive-dialog";
import { StoreForm } from "./store-form";

type StoreUpdateButtonProps = {
  store: Store;
  children: Pick<ResponsiveDialogProps, "trigger">["trigger"];
} & Dictionary["store-update-button"] &
  Dictionary["store-form"] &
  Dictionary["responsive-dialog"];

export function StoreUpdateButton({
  dic: { "store-update-button": c, ...dic },
  store,
  children,
}: StoreUpdateButtonProps) {
  const lang = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
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
          <StoreForm.name dic={dic} form={form} loading={loading} />
        </form>
      </Form>
    </ResponsiveDialog>
  );
}
