import type { Metadata } from "next";

import { getDictionary } from "@/servers/locale";

import { LocaleSwitcher } from "@/components/locale-switcher";

type HomeProps = Readonly<{}>;
export const metadata: Metadata = { title: "Home" };
export default async function Home({}: HomeProps) {
  const dic = await getDictionary();
  return (
    <div>
      Home
      <br />
      {dic?.["site"]?.["name"]}
      <LocaleSwitcher />
    </div>
  );
}
