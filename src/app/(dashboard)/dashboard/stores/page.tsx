import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";

import { queries } from "@/servers/db/queries";
import { getDictionary } from "@/servers/locale";
import { deleteStore } from "@/servers/stores";
import { getAuth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormButton } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import {
  EmptyPlaceholder,
  EmptyPlaceholderDescription,
  EmptyPlaceholderIcon,
  EmptyPlaceholderTitle,
} from "@/components/empty-placeholder";
import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { StoreCreateButton } from "@/components/store-create-button";

type StoresProps = Readonly<{}>;
export const metadata: Metadata = { title: "Stores" };
export default async function Stores({}: StoresProps) {
  const dic = await getDictionary();
  const { user } = await getAuth();
  const c = dic?.["dashboard"]?.["stores"];

  if (!user) redirect(Paths.Login);
  const { data: stores } = await queries.stores.getMany({
    userId: user?.id,
  });

  return (
    <main className="flex-1">
      <div className="container flex flex-1 flex-col py-6">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                {c?.["stores"]}
              </h2>
              <p className="max-w-prose text-sm text-muted-foreground">
                {c?.["browse all stores, edit, and filter."]}
              </p>
            </div>

            <div>{!!stores?.length && <StoreCreateButton />}</div>
          </div>

          <Separator className="my-4" />
        </div>
      </div>

      <div className="container">
        {stores?.length ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((e, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-start gap-2">
                  <Link href={`/ss/${e?.id}`}>
                    <Avatar>
                      <AvatarImage src={e?.logo ?? ""} />
                      <AvatarFallback>
                        <Icons.store />
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="w-full">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="line-clamp-1">{e?.name}</CardTitle>

                      <CardDescription className="whitespace-nowrap text-xs">
                        {formatDate(e?.createdAt, { type: "distance" })}
                      </CardDescription>
                    </div>
                    <CardDescription className="line-clamp-1 max-w-prose text-xs">
                      {e?.username}
                    </CardDescription>
                    <CardDescription className="line-clamp-1 max-w-prose">
                      {e?.bio}
                    </CardDescription>
                    <FormButton
                      variant="destructive"
                      onAction={deleteStore}
                      useForm={{ defaultValues: { id: e?.id, logo: e?.logo } }}
                    >
                      delete
                    </FormButton>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyPlaceholder>
            <EmptyPlaceholderIcon name="inbox" />
            <EmptyPlaceholderTitle>No items yet</EmptyPlaceholderTitle>
            <EmptyPlaceholderDescription>
              Get started by creating your first item. <br />
              You can add as many as you need.
            </EmptyPlaceholderDescription>

            <StoreCreateButton />
          </EmptyPlaceholder>
        )}
      </div>
    </main>
  );
}
