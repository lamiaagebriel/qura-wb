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
import { storeBinSchema } from "@/validations/stores";
import { Store } from "@prisma/client";
import { ResponsiveDialog, ResponsiveDialogProps } from "./responsive-dialog";

type StoreBinButtonProps = {
  store: Store;
  children: Pick<ResponsiveDialogProps, "trigger">["trigger"];
} & Dictionary["store-bin-button"] &
  Dictionary["store-form"] &
  Dictionary["responsive-dialog"];

export function StoreBinButton({
  dic: { "store-bin-button": c, ...dic },
  store,
  children,
}: StoreBinButtonProps) {
  const lang = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof storeBinSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(storeBinSchema),
    defaultValues: { ...store, deletedAt: new Date() },
  });

  async function onSubmit(data: z.infer<typeof storeBinSchema>) {
    await toastPromise(
      async () => await updateStore({ ...data, deletedAt: new Date() }),
      setLoading,
      lang
    );

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
      title={c?.["delete store"]}
      description={
        c?.[
          "once deleted, the store will be moved to the bin. you can manually delete it or it will be automatically removed after 30 days. if restored, everything will be reinstated as if nothing happened."
        ]
      }
      confirm={
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Button disabled={loading} className="w-full md:w-fit">
              {loading && <Icons.spinner />}
              {c?.["delete"]}
            </Button>
          </form>
        </Form>
      }
      trigger={children}
    />
  );
}
