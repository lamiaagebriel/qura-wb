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
import { storeRestoreSchema } from "@/validations/stores";
import { Store } from "@prisma/client";
import { toast } from "sonner";
import { ResponsiveDialog, ResponsiveDialogProps } from "./responsive-dialog";

type StoreRestoreButtonProps = {
  store: Store;
  children: Pick<ResponsiveDialogProps, "trigger">["trigger"];
} & Dictionary["store-restore-button"] &
  Dictionary["store-form"] &
  Dictionary["responsive-dialog"];

export function StoreRestoreButton({
  dic: { "store-restore-button": c, ...dic },
  store,
  children,
}: StoreRestoreButtonProps) {
  const lang = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof storeRestoreSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(storeRestoreSchema),
    defaultValues: { ...store, deletedAt: new Date() },
  });

  async function onSubmit(data: z.infer<typeof storeRestoreSchema>) {
    await toastPromise(
      // @ts-ignore
      async () => await updateStore({ ...data, deletedAt: null }),
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
      title={c?.["restore store"]}
      description={
        c?.[
          "restoring this store will bring back all its data and settings, making it appear as if it was never deleted. all related information will be fully reinstated, allowing you to pick up right where you left off."
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
              {loading && <Icons.spinner />}
              {c?.["restore"]}
            </Button>
          </form>
        </Form>
      }
      trigger={children}
    />
  );
}
