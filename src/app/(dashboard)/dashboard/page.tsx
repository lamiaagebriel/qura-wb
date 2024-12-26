import type { Metadata } from "next";

import { getDictionary } from "@/servers/locale";

import { Separator } from "@/components/ui/separator";

type DashboardProps = Readonly<{}>;
export const metadata: Metadata = { title: "Dashboard" };
export default async function Dashboard({}: DashboardProps) {
  const dic = await getDictionary();
  const c = dic?.["dashboard"]?.["overview"];

  return (
    <main className="flex-1">
      <div className="container flex flex-1 flex-col py-6">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                {c?.["overview"]}
              </h2>
              <p className="max-w-prose text-sm text-muted-foreground">
                {c?.["browse all overview, edit, and filter."]}
              </p>
            </div>
          </div>

          <Separator className="my-4" />
        </div>
      </div>
    </main>
  );
}
