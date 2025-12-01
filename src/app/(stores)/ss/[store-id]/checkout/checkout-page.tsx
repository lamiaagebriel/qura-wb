"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
// BreadcrumbSteps renders a breadcrumb composed of given steps and auto-detects the current page based on pathname.
import { usePathname } from "next/navigation";
import * as React from "react";

import { Paths } from "@/constants";
import { Store } from "@/db/schema";
import { useCartSelectors, useCartStore } from "@/stores/cart-store";
import { User } from "lucia";

import { checkOrderInfo } from "@/servers/orders";
import { cn, formatPrice } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { Form, FormButton, FormInputField } from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
import { Link } from "@/components/ui/link";
import { Separator } from "@/components/ui/separator";
import { useLocale } from "@/components/locale-provider";

import { OrderSummary } from "../(_layout)/cart/cart-page";

type CheckoutPageProps = { store: Store; user: User };
function CheckoutBreadcrumbStepsClient({
  steps,
}: {
  steps: { label: string; href: string }[];
}) {
  const pathname = usePathname();

  // Find the current step by checking the step whose href matches the current pathname
  // Fallback to the first matching, or last if not found
  const currentStepIndex = steps.findIndex((step) => pathname === step.href);
  const activeIdx =
    currentStepIndex !== -1 ? currentStepIndex : steps.length - 1;
  const currentPage = steps[activeIdx]?.href;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {steps.map((e, i) => {
          const isCurrent = e?.href === currentPage;
          // Disable all steps after the current step
          const isDisabled = i > activeIdx;

          return (
            <React.Fragment key={i}>
              {!!i && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isCurrent ? (
                  <BreadcrumbPage>{e?.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={e?.href} disabled={isDisabled}>
                      {e?.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
function SummaryCardClient({ store, user }: CheckoutPageProps) {
  const storeId = store?.id;

  const currentPage = `${Paths.Store}/${storeId}${Paths.StoreCheckout}`;
  const selectors = useCartSelectors();
  const allCheckoutItems = (
    selectors.getProductsByStore(storeId) ?? []
  ).flatMap((item) => {
    const variants =
      Array.isArray(item.attributes) && item.attributes.length > 0
        ? item.attributes
        : [];
    return variants.map((variant, j) => ({
      ...item,
      variant,
      storeId,
      productId: item.id,
      key: `${storeId}-${item.id}-${variant.name}-${variant.value}`,
      image: item.images?.[0] || "/placeholder.svg",
    }));
  });

  return (
    <div>
      <div className="space-y-5">
        {allCheckoutItems.map((item, idx) => (
          <div className="flex items-center gap-3" key={item.key}>
            <div className="relative size-14">
              <div className="flex size-14 items-center justify-center overflow-hidden rounded-lg border bg-gray-100">
                <Image
                  src={item.image}
                  width={56}
                  height={56}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <Badge className="absolute top-0 right-0 z-10 aspect-square w-5 translate-x-1/2 -translate-y-1/2 rounded-full text-xs">
                {item.variant.quantity}
              </Badge>
            </div>
            <div className="min-w-0 flex-1 truncate">
              <div className="truncate font-medium">{item.title}</div>
              <div className="text-muted-foreground truncate text-xs">
                {item.variant.name !== "Default" && (
                  <>
                    {item.variant.name}
                    {item.variant.value ? `: ${item.variant.value}` : ""}
                  </>
                )}
              </div>
            </div>
            <div className="min-w-[60px] text-right text-base font-medium">
              {formatPrice(item.variant.price * item.variant.quantity)}
            </div>
          </div>
        ))}
        {allCheckoutItems.length === 0 && (
          <div className="text-muted-foreground py-7 text-center text-sm">
            Nothing in cart
          </div>
        )}
      </div>
      <Separator className="my-4" />
      <OrderSummary step="checkout-page" storeId={storeId} />
    </div>
  );
}
function CheckoutInfoClient({
  store: { id: storeId },
  user,
}: CheckoutPageProps) {
  const cart = useCartStore();
  const { cmn, db } = useLocale();

  return (
    <Form
      infiniteLoading
      validation="check-order-info"
      onSubmit={async (data) => {
        const response = await checkOrderInfo(data);
        if (!response?.ok) return response;

        cart.setStoreInfo({
          storeId,
          info: { ...data },
        });

        return response;
      }}
      className="my-6 grid grid-cols-1 gap-6"
      useForm={{
        defaultValues: {
          storeId,
          userId: user?.id,
          items: cart?.getProductsByStore(storeId),

          name: cart["cart"][storeId]?.info?.name ?? "",
          phones: cart["cart"][storeId]?.info?.phones ?? [""],
        },
      }}
    >
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="font-medium">Contact Information</div>
          <FormInputField
            label={db["orders"]["address"]["name"]["name"]}
            field={{ name: "name" }}
          />
          <FormInputField
            label="Phones"
            field={{ name: "phones.0" }}
            type="tel"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Link
            href={`${Paths.Store}/${storeId}${Paths.StoreCart}`}
            className={cn(
              buttonVariants({
                variant: "ghost",
              })
            )}
          >
            <Icons.chevronLeft /> Return to Cart
          </Link>

          <FormButton type="submit" size="lg" className="rounded-full py-6">
            {cmn["continue to shipping"]}
          </FormButton>
        </div>
      </div>
    </Form>
  );
}
export const CheckoutInfo = dynamic(() => Promise.resolve(CheckoutInfoClient), {
  ssr: false,
});

export const SummaryCard = dynamic(() => Promise.resolve(SummaryCardClient), {
  ssr: false,
});
export const CheckoutBreadcrumbSteps = dynamic(
  () => Promise.resolve(CheckoutBreadcrumbStepsClient),
  { ssr: false }
);
