import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants";
import { queries } from "@/db/queries";

import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";

import { Review } from "./checkout-review-page";

type StoreCheckoutReviewProps = Readonly<{
  params: Promise<{ "store-id": string }>;
}>;
export const metadata: Metadata = { title: "Review Checkout" };
export default async function StoreCheckoutReview({
  params,
}: StoreCheckoutReviewProps) {
  const { "store-id": storeId } = await params;

  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const dic = await getDictionary();
  const c = dic["dashboard"]["store-id"]["products"];

  const { data: selectedStore } = await queries.stores.get({ id: storeId });
  if (!selectedStore) return <div>NO STORE</div>;

  return <Review user={user} store={selectedStore} />;
}
