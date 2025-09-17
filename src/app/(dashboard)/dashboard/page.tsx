import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants";

import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";

import { DataTable, DataTableProvider } from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";

import { columns, data, DataTableButtons } from "./columns";

type DashboardProps = Readonly<{}>;
export const metadata = async (): Promise<Metadata> => {
  const dic = await getDictionary();
  const c = dic["dashboard"]["overview"];

  return { title: c["dashboard"] };
};

export default async function Dashboard({}: DashboardProps) {
  const dic = await getDictionary();
  const { user } = await getAuth();
  const c = dic["dashboard"]["overview"];
  const locale = dic["locale"];

  if (!user) redirect(Paths.Login);
  const orders = [];

  return (
    <main className="flex-1">
      <div className="container flex flex-1 flex-col py-6">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                {c["dashboard"]}
              </h2>
              <p className="text-muted-foreground max-w-prose text-sm">
                {c["create, browse, edit, and filter all orders easily."]}
              </p>
            </div>

            {/* <div>{!!orders?.length && <OrderCreateButton />}</div> */}
          </div>

          <Separator className="my-4" />
        </div>
      </div>

      <div className="container">
        <DataTableProvider columns={columns} data={data}>
          <div className="flex flex-col gap-4">
            <DataTableButtons />
            <DataTable />
          </div>
        </DataTableProvider>
      </div>
    </main>
  );
}
