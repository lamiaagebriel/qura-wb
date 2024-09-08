"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { UserForm } from "@/components/user/user-form";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/locale";
import { toastPromise } from "@/lib/utils";
import { signInWithGoogle, signUpWithPassword } from "@/servers/users";
import { Dictionary } from "@/types/locale";
import { userAuthRegisterSchema } from "@/validations/users";

type UserAuthRegisterFormProps = {} & Dictionary["auth"] &
  Dictionary["user-form"];

export function UserAuthRegisterForm({
  dic: {
    auth: { register: c },
    ...dic
  },
}: UserAuthRegisterFormProps) {
  const lang = useLocale();
  const [loading, setLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof userAuthRegisterSchema>>({
    resolver: zodResolver(userAuthRegisterSchema),
  });

  async function onSubmit(data: z.infer<typeof userAuthRegisterSchema>) {
    await toastPromise(
      async () => await signUpWithPassword(data),
      setLoading,
      lang
    );
  }
  // async function onSubmit(data: z.infer<typeof userAuthRegisterSchema>) {
  //   try {
  //     setLoading(true);
  //     const res = await signUpWithPassword(data);

  //     if (res?.["error"]) {
  //       const msg = await t(res?.["error"], lang);
  //       toast.error(msg);
  //       return;
  //     }
  //   } catch (error) {
  //   } finally {
  //     setLoading(false);
  //   }
  // }
  return (
    <>
      <div className="grid gap-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <UserForm.name
              dic={dic}
              form={form as any}
              loading={loading || isGoogleLoading}
            />
            <UserForm.email
              dic={dic}
              form={form as any}
              loading={loading || isGoogleLoading}
            />
            <UserForm.password
              dic={dic}
              form={form as any}
              loading={loading || isGoogleLoading}
            />

            <Button className="w-full" disabled={loading || isGoogleLoading}>
              {loading && <Icons.spinner />}
              {c?.["sign up with email"]}
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {c?.["or continue with"]}
            </span>
          </div>
        </div>
        <div className="w-full space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={async () => {
              setIsGoogleLoading(true);
              toast.promise(signInWithGoogle(), {
                error: async (err) => {
                  const msg = await t(err?.["message"], lang);
                  return msg;
                },
              });
            }}
            disabled={loading || isGoogleLoading}
          >
            {isGoogleLoading ? <Icons.spinner /> : <Icons.google />}
            {c?.["sign up with google"]}
          </Button>
        </div>
      </div>
    </>
  );
}
