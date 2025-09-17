import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants";

import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";

import { Separator } from "@/components/ui/separator";

type StoresDashboardProps = Readonly<{}>;
export const metadata = async (): Promise<Metadata> => {
  const dic = await getDictionary();
  const c = dic["dashboard"]["stores"];

  return { title: c["stores"] };
};

export default async function StoresDashboard({}: StoresDashboardProps) {
  const dic = await getDictionary();
  const { user } = await getAuth();
  const c = dic["dashboard"]["stores"];
  const locale = dic["locale"];

  if (!user) redirect(Paths.Login);
  const stores = [];

  return (
    <main className="flex-1">
      <div className="container flex flex-1 flex-col py-6">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                {c["stores"]}
              </h2>
              <p className="text-muted-foreground max-w-prose text-sm">
                {c["create, browse, edit, and filter all stores easily."]}
              </p>
            </div>

            {/* <div>{!!stores?.length && <StoreCreateButton />}</div> */}
          </div>

          <Separator className="my-4" />
        </div>
      </div>

      <div className="container">
        {/* <EmptyPlaceholder>
          <EmptyPlaceholderIcon name="inbox" />
          <EmptyPlaceholderTitle>No items yet</EmptyPlaceholderTitle>
          <EmptyPlaceholderDescription>
            Get started by creating your first item. <br />
            You can add as many as you need.
          </EmptyPlaceholderDescription>

           <StoreCreateButton /> 
        </EmptyPlaceholder> */}
      </div>
    </main>
  );
}
