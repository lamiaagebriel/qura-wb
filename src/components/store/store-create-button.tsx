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
import { createStore } from "@/servers/stores";
import { Dictionary } from "@/types/locale";
import { storeCreateSchema } from "@/validations/stores";
import { toast } from "sonner";

type StoreCreateButtonProps = {} & ButtonProps &
  Dictionary["store-create-button"] &
  Dictionary["store-form"] &
  Dictionary["responsive-dialog"];

export function StoreCreateButton({
  dic: { "store-create-button": c, ...dic },
  children,
  disabled,
  ...props
}: StoreCreateButtonProps) {
  const lang = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(disabled ?? false);
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
              {!disabled && loading && <Icons.spinner />}
              {c?.["submit"]}
            </Button>
          </form>
        </Form>
      }
      trigger={
        children ?? (
          <Button disabled={disabled ?? loading} {...props}>
            {c?.["create store"]}
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
