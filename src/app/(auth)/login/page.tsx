import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants";

import { loginWithGoogle, loginWithPassword } from "@/servers/auth";
import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

import { buttonVariants } from "@/components/ui/button";
import { Form, FormButton, FormInputField } from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
import { Link } from "@/components/link";

type LoginProps = Readonly<{}>;
export const metadata = async (): Promise<Metadata> => {
  const dic = await getDictionary();
  const c = dic["auth"]["login"];

  return { title: c["login"] };
};

export default async function Login({}: LoginProps) {
  const { user } = await getAuth();
  if (user) redirect(Paths.Dashboard);

  const { db, ...dic } = await getDictionary();
  const c = dic["auth"]["login"];

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

      <section className="container flex w-full max-w-sm flex-col justify-center gap-5">
        <div className="flex flex-col gap-2 text-center">
          <Icons.logo className="mx-auto size-16" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {c["welcome back!"]} 🎉
          </h1>
          <p className="text-muted-foreground text-sm">
            {
              c[
                "join our community and unlock amazing features to streamline your work and boost your productivity."
              ]
            }
          </p>
        </div>

        <div>
          <Form
            infiniteLoading
            validation="login-with-password"
            onSubmit={loginWithPassword}
            className="grid grid-cols-1 gap-6"
          >
            <div className="space-y-2">
              <FormInputField
                type="email"
                label={db["users"]["email"]["email"]}
                field={{ name: "email" }}
              />

              <FormInputField
                type="password"
                label={db["users"]["password"]["password"]}
                field={{ name: "password" }}
              />

              <p className="text-muted-foreground text-end text-xs">
                <Link
                  href={Paths.ResetPassword}
                  className="hover:text-primary underline underline-offset-4"
                >
                  {c["forgot password"]}
                </Link>
              </p>

              <FormButton type="submit" className="w-full">
                {c["sign in with email"]}
              </FormButton>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background text-muted-foreground px-2">
                  {c["or continue with"]}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <FormButton
                infiniteLoading
                onAction={loginWithGoogle}
                variant="outline"
                className="w-full"
                Icon={<Icons.google className="size-5" />}
              >
                {c["sign in with google"]}
              </FormButton>
              <p className="text-muted-foreground text-center text-sm">
                <Link
                  href={Paths.Register}
                  className="hover:text-primary underline underline-offset-4"
                >
                  {c["don't have an account? sign up now"]}
                </Link>
              </p>
            </div>
          </Form>
        </div>
      </section>
    </div>
  );
}
