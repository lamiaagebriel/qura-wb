import type { Metadata } from "next";

import { getDictionary } from "@/servers/locale";

type HomeProps = Readonly<{}>;
export const metadata: Metadata = { title: "Home" };
export default async function Home({}: HomeProps) {
  const dic = await getDictionary();
  return <div>{dic?.["site"]?.["name"]}</div>;
}
