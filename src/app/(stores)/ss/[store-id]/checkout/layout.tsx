import { redirect } from "next/navigation";

import { Paths } from "@/constants";
import { queries } from "@/db/queries";

import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/ui/icons";

import { CheckoutBreadcrumbSteps, SummaryCard } from "./checkout-page";

type CheckoutLayoutProps = Readonly<
  React.PropsWithChildren<{
    params: Promise<{ "store-id": string }>;
  }>
>;
export default async function CheckoutLayout({
  params,
  children,
}: CheckoutLayoutProps) {
  const { "store-id": storeId } = await params;

  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const dic = await getDictionary();
  const c = dic["dashboard"]["store-id"]["products"];

  const { data: selectedStore } = await queries.stores.get({ id: storeId });
  if (!selectedStore) return <div>NO STORE</div>;

  const steps = [
    {
      href: `${Paths.Store}/${storeId}${Paths.StoreCart}`,
      label: "Cart",
    },
    {
      href: `${Paths.Store}/${storeId}${Paths.StoreCheckout}`,
      label: "Information",
    },
    {
      href: `${Paths.Store}/${storeId}${Paths.StoreCheckoutShipping}`,
      label: "Shipping",
    },
    {
      href: `${Paths.Store}/${storeId}${Paths.StoreCheckoutPayment}`,
      label: "Payment",
    },
    {
      href: `${Paths.Store}/${storeId}${Paths.StoreCheckoutReview}`,
      label: "Review",
    },
  ];
  return (
    <>
      <header className="bg-muted border-b">
        <div className="container flex items-center justify-center gap-2 py-4">
          <Avatar className="size-10 rounded-md">
            <AvatarImage src={selectedStore?.logo!} alt={selectedStore?.name} />
            <AvatarFallback>
              <Icons.store />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-bold uppercase">
              {selectedStore.name}
            </h1>
            <p className="text-muted-foreground text-xs">
              {selectedStore?.username}
            </p>
          </div>
        </div>
      </header>

      <div className="container grid max-w-6xl! gap-20 py-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <CheckoutBreadcrumbSteps steps={steps} />

          {children}
        </div>

        <SummaryCard store={selectedStore} user={user} />
      </div>
    </>
  );
}
