import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants";
import { queries } from "@/db/queries";

import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";

import { Separator } from "@/components/ui/separator";

type StoreDashboardProps = Readonly<{
  params: Promise<{ "store-id": string }>;
}>;
export const metadata = async (): Promise<Metadata> => {
  const dic = await getDictionary();
  const c = dic["dashboard"]["store-id"];

  return { title: c["overview"] };
};

export default async function StoreDashboard({ params }: StoreDashboardProps) {
  const { "store-id": storeId } = await params;

  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const dic = await getDictionary();
  const c = dic["dashboard"]["store-id"];

  const { data: selectedStore } = await queries.stores.get({ id: storeId });
  if (!selectedStore) return <div>NO STORE</div>;

  return (
    <main className="flex-1">
      <div className="container flex flex-1 flex-col py-6">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                {c["overview"]}
              </h2>
              <p className="text-muted-foreground max-w-prose text-sm">
                {c["browse all overview, edit, and filter."]}
              </p>
            </div>
          </div>

          <Separator className="my-4" />
        </div>
      </div>

      <div className="container">{storeId}</div>
    </main>
  );
}
