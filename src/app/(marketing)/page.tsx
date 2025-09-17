import { getDictionary } from "@/servers/locale";

type HomeProps = Readonly<{}>;
export default async function Home({}: HomeProps) {
  const dic = await getDictionary();
  return <div className="container">{dic?.["site"]?.["name"]}</div>;
}
