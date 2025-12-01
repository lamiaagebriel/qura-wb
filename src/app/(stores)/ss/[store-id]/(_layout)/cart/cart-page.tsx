"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import React from "react";

import { Paths } from "@/constants";
import { Store } from "@/db/schema";
import {
  getDiscountLabel,
  ProductIdProps,
  useCartActions,
  useCartSelectors,
  useCartStore,
} from "@/stores/cart-store";
import { User } from "lucia";

import { cn, formatPrice } from "@/lib/utils";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Icons } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/components/ui/link";

type CartPageProps = { store: Store; user: User };
function CartPage({ store: { id: storeId }, user }: CartPageProps) {
  const cart = useCartStore();
  const actions = useCartActions();
  const selectors = useCartSelectors();
  const storeProducts = selectors.getProductsByStore(storeId);
  const allCartItems = storeProducts.flatMap((item) => {
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

  const handleUpdateQuantity = (
    storeId: string,
    productId: string,
    attributes: Pick<ProductIdProps["attributes"][0], "name" | "value">[],
    quantity: number
  ) => {
    if (quantity < 1) return;
    actions.updateQuantity({ storeId, productId, attributes, quantity });
  };

  const handleRemoveProduct = (
    storeId: string,
    productId: string,
    attributes: Pick<ProductIdProps["attributes"][0], "name" | "value">[]
  ) => {
    actions.removeProduct({ storeId, productId, attributes });
  };

  if (!allCartItems?.length)
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icons.inbox />
          </EmptyMedia>
          <EmptyTitle>Your Cart is Empty</EmptyTitle>
          <EmptyDescription>
            You haven&apos;t added any items to your cart yet. Start shopping to
            fill your cart.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2">
            <Link
              href={`${Paths.Store}/${storeId}`}
              className={cn(buttonVariants({}))}
            >
              Shop Now
            </Link>
            <Link
              href={`${Paths.Store}/${storeId}`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Browse Stores
            </Link>
          </div>
        </EmptyContent>
        <Link
          href={`${Paths.Store}/${storeId}`}
          className={cn(
            buttonVariants({
              variant: "link",
              size: "sm",
            })
          )}
        >
          <Icons.chevronLeft /> Learn more
        </Link>
      </Empty>
    );
  return (
    <div className="container py-10">
      <div className="flex justify-between">
        <h1 className="mb-6 text-2xl font-semibold">Shopping Cart</h1>
        {/* <span>{JSON.stringify(cart.cart, null, 0)}</span> */}
        {/* {allCartItems.length > 0 && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => actions.clearCart()}
          >
            Clear All
          </Button>
        )} */}
      </div>
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="flex-1">
          <Card className="overflow-x-auto">
            <table className="divide-muted min-w-full divide-y">
              <thead>
                <tr className="text-left text-sm font-medium">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4 text-center">Quantity</th>
                  <th className="px-6 py-4 text-center">Total</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {allCartItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center">
                      Your cart is empty.
                    </td>
                  </tr>
                )}
                {allCartItems.map((item, idx) => (
                  <tr
                    key={item.key}
                    className="hover:bg-muted border-b transition last:border-b-0"
                  >
                    <td className="flex items-center gap-4 px-6 py-4">
                      <div className="border-muted h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border bg-gray-100">
                        <Image
                          src={item.image}
                          alt={item.title}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="whitespace-nowrap">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-muted0 text-xs">
                          {item.variant.name !== "Default" && (
                            <>
                              {item.variant.name}
                              {item.variant.value
                                ? `: ${item.variant.value}`
                                : ""}
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center overflow-hidden rounded-full border">
                        <Button
                          variant="ghost"
                          onClick={() =>
                            handleUpdateQuantity(
                              item.storeId,
                              item.productId,
                              [
                                {
                                  name: item.variant.name,
                                  value: item.variant.value,
                                },
                              ],
                              item.variant.quantity - 1
                            )
                          }
                          aria-label="Decrease quantity"
                        >
                          <Icons.minus />
                        </Button>
                        <span className="w-10 text-center text-base font-medium">
                          {item.variant.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            handleUpdateQuantity(
                              item.storeId,
                              item.productId,
                              [
                                {
                                  name: item.variant.name,
                                  value: item.variant.value,
                                },
                              ],
                              item.variant.quantity + 1
                            )
                          }
                          aria-label="Increase quantity"
                        >
                          <Icons.plus />
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-lg font-semibold">
                      {formatPrice(
                        (item.variant.price || 0) * (item.variant.quantity || 0)
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-full"
                        onClick={() =>
                          handleRemoveProduct(item.storeId, item.productId, [
                            {
                              name: item.variant.name,
                              value: item.variant.value,
                            },
                          ])
                        }
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <div className="w-full flex-shrink-0 md:w-96">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>

            <OrderSummary step="cart-page" storeId={storeId} />

            <Link
              href={`${Paths.Store}/${storeId}${Paths.StoreCheckout}`}
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Checkout Now
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function OrderSummary({
  step = "cart-page",
  storeId,
}: {
  step?: "cart-page" | "checkout-page";
  storeId: string;
}) {
  const cart = useCartStore();
  const actions = useCartActions();
  const selectors = useCartSelectors();

  const storeDiscount = selectors.getStoreDiscount(storeId);
  const {
    subtotal: subTotal,
    discountAmount,
    total,
    deliveryFee,
  } = selectors.getNumbersByStore(storeId);
  const [discountCode, setDiscountCode] = React.useState(storeDiscount?.code);
  const [isApplyingDiscount, setIsApplyingDiscount] = React.useState(false);
  const [discountError, setDiscountError] = React.useState("");

  const discountLabel = getDiscountLabel({ storeDiscount, subTotal });

  const handleApplyDiscount = async () => {
    setIsApplyingDiscount(true);
    setDiscountError("");
    const code = discountCode?.trim().toUpperCase();
    if (code === "SAVE10") {
      actions.setStoreDiscount({ storeId, discount: { code, percentage: 10 } });
    } else if (code === "SAVE50") {
      actions.setStoreDiscount({ storeId, discount: { code, value: 50 } });
    } else {
      setDiscountError("Invalid discount code");
    }
    setIsApplyingDiscount(false);
  };
  const handleRemoveDiscount = () => {
    actions.removeStoreDiscount(storeId);
    setDiscountError("");
    setDiscountCode("");
  };
  return (
    <div>
      <div className="mb-4">
        <div className="flex items-end gap-2">
          <div className="flex w-full flex-col gap-1">
            <Label htmlFor="discount">Discount Voucher</Label>
            <Input
              id="discount"
              name="discount"
              placeholder="Discount voucher"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              disabled={isApplyingDiscount || !!storeDiscount?.code}
            />
          </div>
          {!storeDiscount?.code ? (
            <Button
              onClick={handleApplyDiscount}
              disabled={isApplyingDiscount || !discountCode}
            >
              {isApplyingDiscount ? "Applying..." : "Apply"}
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={handleRemoveDiscount}
            >
              <Icons.x />
            </Button>
          )}
        </div>
        {discountError && (
          <div className="mt-1 text-sm text-red-600">{discountError}</div>
        )}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(subTotal)}</span>
        </div>
        {discountLabel ? (
          <div className="flex justify-between">
            <span>{discountLabel || "Discount"}</span>
            <span className="text-destructive">
              - {formatPrice(discountAmount)}
            </span>{" "}
          </div>
        ) : null}

        {step === "checkout-page" ? (
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="text-muted-foreground">
              {!!deliveryFee ? `+${formatPrice(deliveryFee)}` : "-"}
            </span>
          </div>
        ) : null}

        <div className="mt-8 flex justify-between text-lg font-bold">
          <span>{step === "checkout-page" ? "Total" : "Estimated total"} </span>
          <span className="font-serif">{formatPrice(total)}</span>
        </div>

        {step === "cart-page" ? (
          <p className="text-muted-foreground">
            Taxes and shipping calculated at checkout.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export const CartExample = dynamic(() => Promise.resolve(CartPage), {
  ssr: false,
});
