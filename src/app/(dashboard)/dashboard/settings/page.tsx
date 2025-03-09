import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Paths } from "@/constants/utils";

import { getDictionary } from "@/servers/locale";
import { updateUser } from "@/servers/users";
import { getAuth } from "@/lib/auth";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormButton, FormInputField } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/icons";

type ProfileProps = Readonly<{}>;
export const metadata = async (): Promise<Metadata> => {
  const dic = await getDictionary();
  const c = dic["dashboard"]["settings"]["profile"];

  return { title: c["profile"] };
};
export default async function Profile({}: ProfileProps) {
  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const dic = await getDictionary();
  const c = dic["dashboard"]["settings"]["profile"];
  const cmn = dic["cmn"];
  const db = dic["db"];

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
        <Form
          validation="update-user"
          onSubmit={updateUser}
          useForm={{ defaultValues: { ...user } }}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarImage src={user?.image!} alt={user?.name!} />
                  <AvatarFallback>
                    <Icons.user />
                  </AvatarFallback>
                </Avatar>

                <FormInputField
                  label={db["users"]["name"]["name"]}
                  field={{ name: "name" }}
                />
              </div>

              <FormInputField
                type="tel"
                countryCode={user?.phone?.split(" ")[0]}
                label={db["users"]["phone"]["phone"]}
                field={{ name: "phone" }}
              />
            </div>

            <div className="col-span-2">
              <FormInputField
                type="email"
                label={db["users"]["email"]["email"]}
                field={{ name: "email" }}
                disabled={user?.emailVerified}
                description={
                  user?.emailVerified
                    ? db["users"]["email"][
                        "this email addresses is verified & immutable."
                      ]
                    : db["users"]["email"][
                        "this email addresses is needs to be verified or changed."
                      ]
                }
              />
            </div>
          </div>
          <FormButton type="submit">{cmn["update data"]}</FormButton>
        </Form>
      </div>
    </main>
  );
}
