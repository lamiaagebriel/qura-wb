"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

import { Paths } from "@/constants";
import { Store } from "@/db/schema";
import {
  ProductIdProps,
  useCartActions,
  useCartSelectors,
  useCartStore,
} from "@/stores/cart-store";
import { User } from "lucia";

import { cn } from "@/lib/utils";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { Link } from "@/components/ui/link";

type CartPageProps = { store: Store; user: User };

function CartPage({ store: { id: storeId }, user }: CartPageProps) {
  const cart = useCartStore();
  const actions = useCartActions();
  const selectors = useCartSelectors();

  // For demo, you might want to hardcode a delivery fee and discount for now
  const DELIVERY_FEE = 0;
  const DISCOUNT = 50;

  // Flatten all products for all stores for the table
  const allCartItems = Object.keys(cart.cart).flatMap((storeId) => {
    const storeProducts = selectors.getProductsByStore(storeId);
    return storeProducts.flatMap((item) => {
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
  });

  // Calculate subtotal
  const subTotal = allCartItems.reduce(
    (sum, item) =>
      sum + (item.variant.price || 0) * (item.variant.quantity || 0),
    0
  );
  const total = subTotal - DISCOUNT + DELIVERY_FEE;

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

  return (
    <div className="container py-10">
      <div className="flex justify-between">
        <h1 className="mb-6 text-2xl font-semibold">Shopping Cart</h1>
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
        {/* Cart Table */}
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
                          // className="hover:bg-muted flex h-8 w-8 items-center justify-center text-lg font-bold text-gray-600"
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
                          // className="hover:bg-muted flex h-8 w-8 items-center justify-center text-lg font-bold text-gray-600"
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
                      $
                      {(
                        (item.variant.price || 0) * (item.variant.quantity || 0)
                      ).toLocaleString()}
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

        {/* Order Summary */}
        <div className="w-full flex-shrink-0 md:w-96">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
            {/* <div className="mb-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Discount voucher"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                disabled
              />
              <button
                type="button"
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-900"
                disabled
              >
                Apply
              </button>
            </div>
          </div> */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Sub Total</span>
                <span>{subTotal.toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between">
                <span>Discount (10%)</span>
                <span>-{DISCOUNT.toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery fee</span>
                <span className="text-muted-foreground">
                  calculated on checkout
                </span>
                {/* <span>{DELIVERY_FEE.toLocaleString()} USD</span> */}
              </div>
              <div className="border-muted my-2 border-t"></div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{total.toLocaleString()} USD</span>
              </div>
            </div>

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

export const CartExample = dynamic(() => Promise.resolve(CartPage), {
  ssr: false,
});
