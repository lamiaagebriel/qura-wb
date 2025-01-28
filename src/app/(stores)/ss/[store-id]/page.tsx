import type { Metadata } from "next";

import { getDictionary } from "@/servers/locale";

type DashboardProps = Readonly<{}>;
export const metadata: Metadata = { title: "Dashboard" };
export default async function Dashboard({}: DashboardProps) {
  const dic = await getDictionary();
  const c = dic["dashboard"];

  return (
    <main className="flex-1">
      <div className="container">Dashboard</div>
    </main>
  );
}
