import type { Metadata } from "next";

import { getDictionary } from "@/lib/locale";

type HomeProps = Readonly<{}>;
export const metadata: Metadata = { title: "Home" };
export default async function Home({}: HomeProps) {
  const dic = await getDictionary();
  return (
    <div>
      Home
      <br />
      {dic?.["site"]?.["name"]}
    </div>
  );
}
