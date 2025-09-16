import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants";

import { loginWithGoogle, registerWithPassword } from "@/servers/auth";
import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

import { buttonVariants } from "@/components/ui/button";
import { Form, FormButton, FormInputField } from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
import { Link } from "@/components/link";

type RegisterProps = Readonly<{}>;
export const metadata = async (): Promise<Metadata> => {
  const dic = await getDictionary();
  const c = dic["auth"]["register"];

  return { title: c["register"] };
};

export default async function Register({}: RegisterProps) {
  const { user } = await getAuth();
  if (user) redirect(Paths.Dashboard);

  const { db, ...dic } = await getDictionary();
  const c = dic["auth"]["register"];

  return (
    <div className="grid min-h-screen items-center justify-center overflow-auto lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        href={Paths.Login}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute top-4 right-4"
        )}
      >
        {c["login"]}
      </Link>

      <div className="bg-muted hidden h-full lg:block" />
      <section className="container flex w-full max-w-sm flex-col justify-center gap-5">
        <div className="flex flex-col gap-2 text-center">
          <Icons.logo className="mx-auto size-16" />

          <h1 className="text-2xl font-semibold tracking-tight">
            {c["create an account!"]} 🎉
          </h1>
          <p className="text-muted-foreground text-sm">
            {
              c[
                "join our community and unlock amazing features to streamline your work and boost your productivity."
              ]
            }
          </p>
        </div>
        <div className="grid gap-4">
          <Form
            infiniteLoading
            validation="register-with-password"
            onSubmit={registerWithPassword}
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

              <FormButton type="submit" className="w-full">
                {c["sign up with email"]}
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
                {c["sign up with google"]}
              </FormButton>
            </div>
          </Form>
          <p className="text-muted-foreground px-8 text-center text-sm">
            {c["by clicking continue, you agree to our"]}{" "}
            <Link
              href={Paths.TermsOfService}
              className="hover:text-brand underline underline-offset-4"
            >
              {c["terms of service"]}
            </Link>{" "}
            {c["and"]}{" "}
            <Link
              href={Paths.PrivacyPolicy}
              className="hover:text-brand underline underline-offset-4"
            >
              {c["privacy policy"]}
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
