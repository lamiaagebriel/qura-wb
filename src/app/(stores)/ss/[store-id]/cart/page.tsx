import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants";
import { queries } from "@/db/queries";

import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";

import { CartExample } from "./cart-page";

type StoreCartProps = Readonly<{ params: Promise<{ "store-id": string }> }>;
export const metadata: Metadata = { title: "Store Cart" };
export default async function StoreCart({ params }: StoreCartProps) {
  const { "store-id": storeId } = await params;

  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const dic = await getDictionary();
  const c = dic["dashboard"]["store-id"]["products"];

  const { data: selectedStore } = await queries.stores.get({ id: storeId });
  if (!selectedStore) return <div>NO STORE</div>;

  return <CartExample user={user} store={selectedStore} />;
}
