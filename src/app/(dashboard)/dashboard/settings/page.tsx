import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Paths } from "@/constants/utils";

import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";

import { Form, FormButton, FormInputField } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

type ProfileProps = Readonly<{}>;
export const metadata: Metadata = { title: "Profile" };
export default async function Profile({}: ProfileProps) {
  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const dic = await getDictionary();
  const c = dic["dashboard"]["settings"]["profile"];
  const cmn = dic["cmn"];
  return (
    <main className="flex-1">
      <div>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              {c["profile"]}
            </h2>
            <p className="max-w-prose text-sm text-muted-foreground">
              {c["this is how others will see you on the site."]}
            </p>
          </div>
        </div>

        <Separator className="my-4" />
      </div>

      <div>
        {/* @ts-expect-error no onSubmit */}
        <Form
          validation="user-schema"
          // onSubmit={updateUser}
          className="flex flex-col gap-4"
        >
          {/* <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInputField
                field={{ name: "name" }}
                label={ff?.["name"]?.["name"]}
                placeholder={ff?.["name"]?.["joe doe"]}
                className="bg-background text-foreground"
              />
              <FormInputField
                field={{ name: "fullName" }}
                label={ff?.["name"]?.["full name"]}
                placeholder={ff?.["name"]?.["joe doe full"]}
                className="bg-background text-foreground"
              />
            </div>
            <div className="col-span-2">
              <FormInputField
                type="email"
                field={{ name: "email" }}
                disabled={true}
                label={ff?.["email"]?.["email"]}
                description={
                  ff?.["email"]?.[
                    "this email addresses is verified & immutable."
                  ]
                }
                className="bg-background text-foreground"
              />
            </div>

            <div className="col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormInputField
                type="number"
                field={{ name: "age" }}
                label={ff?.["age"]?.["age"]}
                placeholder={`20`}
                className="bg-background text-foreground"
              />
              <FormInputField
                field={{ name: "phone" }}
                dir="ltr"
                label={ff?.["phone"]?.["phone"]}
                placeholder={ff?.["phone"]?.["+966 575 550 336"]}
                className="bg-background text-foreground"
              />

              <FormInputField
                field={{ name: "nationality" }}
                label={ff?.["nationality"]?.["nationality"]}
                placeholder={ff?.["nationality"]?.["saudi"]}
                className="bg-background text-foreground"
              />
            </div>
          </div> */}
          <FormButton type="submit">{cmn["update data"]}</FormButton>
        </Form>
      </div>
    </main>
  );
}
