import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";

import { resetPassword } from "@/servers/auth";
import { getDictionary } from "@/servers/locale";
import { cn } from "@/lib/utils";

import { buttonVariants } from "@/components/ui/button";
import { Form, FormButton, FormInputField } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/icons";
import { Link } from "@/components/link";

type ResetPasswordProps = Readonly<{ params: Promise<{ token: string }> }>;
export const metadata = async (): Promise<Metadata> => {
  const dic = await getDictionary();
  const c = dic["auth"]["reset-password"];

  return { title: c["reset password"] };
};

export default async function ResetPassword({ params }: ResetPasswordProps) {
  const { token } = await params;

  const { db, cmn, ...dic } = await getDictionary();
  const c = dic["auth"]["reset-password"];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-auto">
      <Link
        href={Paths.Home}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute left-4 top-4 gap-2 rtl:flex-row-reverse"
        )}
      >
        <Icons.chevronLeft />
        {c["back home"]}
      </Link>

      <section className="container flex w-full max-w-sm flex-col justify-center gap-5">
        <div className="flex flex-col gap-2 text-center">
          <Icons.logo className="mx-auto size-16" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {c["reset password"]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {c["enter a new strong password twice."]}
          </p>
        </div>

        <div>
          <Form
            infiniteLoading
            validation="reset-password"
            onSubmit={resetPassword}
            useForm={{ defaultValues: { token } }}
          >
            <div className="space-y-2">
              <FormInputField
                type="password"
                label={db["users"]["password"]["password"]}
                field={{ name: "password" }}
              />
              <FormInputField
                type="password"
                label={db["users"]["password"]["confirm password"]}
                field={{ name: "confirmPassword" }}
              />

              <FormButton type="submit" className="w-full">
                {cmn["confirm"]}
              </FormButton>
            </div>

            <Separator className="mb-2 mt-4" />

            <p className="text-center text-sm text-muted-foreground">
              <Link
                href={Paths.Login}
                className="underline underline-offset-4 hover:text-primary"
              >
                {c["remember password? login now"]}
              </Link>
            </p>
          </Form>
        </div>
      </section>
    </div>
  );
}
