import type { Metadata } from "next";

import { Paths } from "@/constants";

import { cn } from "@/lib/utils";
import { resetPassword } from "@/servers/auth";
import { getDictionary } from "@/servers/locale";

import { buttonVariants } from "@/components/ui/button";
import { Form, FormButton, FormInputField } from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
import { Link } from "@/components/ui/link";
import { Separator } from "@/components/ui/separator";

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
          "absolute top-4 left-4 gap-2 rtl:flex-row-reverse"
        )}
      >
        <Icons.chevronLeft />
        {c["back home"]}
      </Link>

      <section className="container flex w-full !max-w-sm flex-col justify-center gap-5">
        <div className="flex flex-col gap-2 text-center">
          <Icons.logo className="mx-auto size-16" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {c["reset password"]}
          </h1>
          <p className="text-muted-foreground text-sm">
            {c["enter a new strong password twice."]}
          </p>
        </div>

        <div>
          <Form
            infiniteLoading
            validation="reset-password"
            onSubmit={resetPassword}
            useForm={{
              defaultValues: { token, password: "", confirmPassword: "" },
            }}
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

            <Separator className="mt-4 mb-2" />

            <p className="text-muted-foreground text-center text-sm">
              <Link
                href={Paths.Login}
                className="hover:text-primary underline underline-offset-4"
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
