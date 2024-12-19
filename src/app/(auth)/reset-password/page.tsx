import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";

import { sendPasswordResetLink } from "@/servers/auth";
import { getDictionary } from "@/servers/locale";
import { geAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

import { buttonVariants } from "@/components/ui/button";
import { Form, FormButton, FormInputField } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/icons";

type ForgotPasswordProps = Readonly<{}>;
export const metadata: Metadata = { title: "Forgot Password" };
export default async function ForgotPassword({}: ForgotPasswordProps) {
  const { user } = await geAuth();
  if (user) redirect(Paths.Dashboard);

  const { "form-fields": ff, ...dic } = await getDictionary();
  const c = dic?.["auth"]?.["forgot-password"];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-auto">
      <Link
        href={Paths.Login}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute left-4 top-4 gap-2 rtl:flex-row-reverse"
        )}
      >
        <Icons.chevronLeft />
        {c?.["login"]}
      </Link>

      <section className="container flex w-full max-w-sm flex-col justify-center gap-5">
        <div className="flex flex-col gap-2 text-center">
          <Icons.logo className="mx-auto size-16" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {c?.["forgot password?"]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {c?.["password reset link will be sent to your email."]}
          </p>
        </div>

        <div>
          <Form
            validation="send-password-reset-link-schema"
            useForm={{ defaultValues: { email: "" } }}
            onSubmit={sendPasswordResetLink}
          >
            <div className="space-y-2">
              <FormInputField
                type="email"
                label={ff?.["email"]?.["email"]}
                field={{ name: "email" }}
              />

              <FormButton type="submit" className="w-full">
                {ff?.["confirm"]}
              </FormButton>
            </div>

            <Separator className="mb-2 mt-4" />

            <p className="text-center text-sm text-muted-foreground">
              <Link
                href={Paths.Register}
                className="underline underline-offset-4 hover:text-primary"
              >
                {c?.["don't have an account? sign up now"]}
              </Link>
            </p>
          </Form>
        </div>
      </section>
    </div>
  );
}
