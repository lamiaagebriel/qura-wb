import type { Metadata } from "next";

import CartPage from "./cart-page";

type CartProps = Readonly<{
  params: Promise<{ "store-id": string }>;
}>;
export const metadata: Metadata = { title: "Cart" };
export default async function Cart({ params }: CartProps) {
  const { "store-id": storeId } = await params;

  return <CartPage store={{ id: storeId }} />;
}
