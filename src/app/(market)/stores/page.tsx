import type { Metadata } from "next";

import { Paths } from "@/constants/utils";

import { queries } from "@/servers/db/queries";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/components/link";

type StoresProps = Readonly<{}>;
export const metadata: Metadata = { title: "Stores" };
export default async function Stores({}: StoresProps) {
  const { data: stores } = await queries.stores.getMany({});
  if (!stores?.length) return <>NO STORES</>;

  return (
    <div className="container py-4">
      <div className="grid grid-cols-4 gap-2">
        {stores?.map((e, i) => (
          <Card key={i}>
            <Link href={`${Paths.Store}/${e?.id}`}>
              <CardHeader>
                <CardTitle>{e?.name}</CardTitle>
              </CardHeader>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
