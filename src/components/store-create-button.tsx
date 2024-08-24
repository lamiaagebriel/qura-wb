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
import { createStore } from "@/servers/stores";
import { Dictionary } from "@/types/locale";
import { storeCreateSchema } from "@/validations/stores";
import { toast } from "sonner";
import { ResponsiveDialog, ResponsiveDialogProps } from "./responsive-dialog";
import { StoreForm } from "./store-form";

type StoreCreateButtonProps = {
  children: Pick<ResponsiveDialogProps, "trigger">["trigger"];
} & Dictionary["store-create-button"] &
  Dictionary["store-form"] &
  Dictionary["responsive-dialog"];

export function StoreCreateButton({
  dic: { "store-create-button": c, ...dic },
  children,
}: StoreCreateButtonProps) {
  const lang = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof storeCreateSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(storeCreateSchema),
  });

  async function onSubmit(data: z.infer<typeof storeCreateSchema>) {
    await toastPromise(async () => await createStore(data), setLoading, lang);

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
      title={c?.["create store"]}
      description={
        c?.[
          "by providing detailed information about your store, you'll be able to streamline your operations, track progress, and ensure that all stakeholders are informed about the development's key aspects and milestones."
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
