import type { Metadata } from "next";
import { Suspense } from "react";

import { getDictionary } from "@/lib/dictionaries";
import { LocaleProps } from "@/types/locale";

import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { UserAuthRegisterForm } from "@/components/user-auth-register-form";

type RegisterProps = Readonly<{ params: LocaleProps }>;

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

export default async function Register({ params: { lang } }: RegisterProps) {
  const dic = await getDictionary(lang);
  const c = dic?.["auth"]?.["register"];

  return (
    <div className="grid min-h-[700px] flex-1 items-center justify-center overflow-auto lg:grid-cols-2">
      {/* <BackButton variant="ghost" className="absolute right-4 top-4 gap-2" /> */}

      <section className="container relative hidden h-full flex-col bg-[url('https://images.unsplash.com/photo-1649518325538-0e1a1e8c63db?q=80&w=1930&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover p-10 text-primary-foreground dark:border-r lg:flex">
        <div className="absolute inset-0 bg-primary/50" />
        <p className="z-20 flex items-center gap-2 text-lg font-medium">
          <Icons.logo /> {dic?.["site"]?.["name"]}
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

      {/* <section className="bg-muted container relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
        <div className="bg-primary absolute inset-0" />
        <p className="z-20 flex items-center text-lg font-medium">
          <Icons.logo />
          Acme Inc
        </p>

        <div className="z-20 mt-auto">
          <blockquote className="space-y-2 italic">
            <p className="text-lg">
              &ldquo;Since partnering with Acme Inc, our sales have increased by
              40% and customer satisfaction has skyrocketed. Their platform has
              streamlined our operations and boosted our business growth.&rdquo;
            </p>
            <footer className="text-sm">
              Alex Thompson, CEO of Thompson Enterprises
            </footer>
          </blockquote>
        </div>
      </section> */}

      <section className="container mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {c?.["create an account!"]} 🎉
          </h1>
          <p className="text-sm text-muted-foreground">
            {
              c?.[
                "join our community and unlock amazing features to streamline your work and boost your productivity."
              ]
            }
          </p>
        </div>
        <div className="grid gap-4">
          <Suspense>
            <UserAuthRegisterForm dic={dic} />
          </Suspense>

          {/* <p className="text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p> */}
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="underline underline-offset-4 hover:text-primary"
            >
              {
                dic?.["auth"]?.["register"]?.[
                  "already have an account? sign in."
                ]
              }
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
