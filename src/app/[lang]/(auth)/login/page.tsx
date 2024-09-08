import { Metadata } from "next";
import { Suspense } from "react";

import { getDictionary } from "@/lib/dictionaries";
import { LocaleProps } from "@/types/locale";

import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { UserAuthLoginForm } from "@/components/user/user-auth-login-form";

type LoginProps = Readonly<{
  params: LocaleProps;
}>;

export async function generateMetadata({
  params: { lang },
}: Readonly<{
  params: LocaleProps;
}>): Promise<Metadata> {
  const {
    auth: {
      register: { meta: c },
    },
  } = await getDictionary(lang);

  return {
    title: c?.["title"],
  };
}

export default async function Login({ params: { lang } }: LoginProps) {
  const dic = await getDictionary(lang);
  const c = dic?.["auth"]?.["login"];

  return (
    <div className="grid min-h-[700px] flex-1 items-center justify-center overflow-auto lg:grid-cols-2">
      {/* <BackButton variant="ghost" className="absolute right-4 top-4 gap-2" /> */}

      <section className="container relative hidden h-full flex-col bg-[url('https://images.unsplash.com/photo-1649518325538-0e1a1e8c63db?q=80&w=1930&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover p-10 text-primary-foreground dark:border-r lg:flex">
        <div className="absolute inset-0 bg-primary/50" />
        <p className="z-20 flex items-center gap-2 text-lg font-medium">
          <Icons.logo />
          {dic?.["site"]?.["name"]}
        </p>

        <div className="z-20 mt-auto">
          <blockquote className="space-y-2 italic">
            <p className="text-lg">
              {
                c?.[
                  "since collaborating with Deal Ai, our property sales have surged by 40%, and client satisfaction has reached new heights. their platform has optimized our operations, driving significant business growth."
                ]
              }
            </p>
            <footer className="text-sm">
              {c?.["Alex Thompson, CEO of Thompson Real Estate"]}
            </footer>
          </blockquote>
        </div>
      </section>

      <section className="container mx-auto flex w-full flex-col justify-center space-y-5 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {c?.["welcome back!"]} 🎉
          </h1>
          <p className="text-sm text-muted-foreground">
            {
              c?.[
                "join our community and unlock amazing features to streamline your work and boost your productivity."
              ]
            }
          </p>
        </div>
        <div className="grid gap-6">
          <Suspense>
            <UserAuthLoginForm dic={dic} />
          </Suspense>

          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/register"
              className="underline underline-offset-4 hover:text-primary"
            >
              {dic?.["auth"]?.["login"]?.["don't have an account? sign up now"]}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
