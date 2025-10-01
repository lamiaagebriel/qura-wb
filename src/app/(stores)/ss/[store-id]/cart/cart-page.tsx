"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

import { Store } from "@/db/schema";
import {
  ProductIdProps,
  useCartActions,
  useCartSelectors,
  useCartStore,
} from "@/stores/cart-store";
import { User } from "lucia";

import { Button } from "@/components/ui/button";

type CartPageProps = { store: Store; user: User };

function CartPage({ store, user }: CartPageProps) {
  const cart = useCartStore();
  const actions = useCartActions();
  const selectors = useCartSelectors();

  // For demo, you might want to hardcode a delivery fee and discount for now
  const DELIVERY_FEE = 25;
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
    <div className="container flex flex-col gap-8 py-10 md:flex-row">
      {/* Cart Table */}
      <div className="flex-1">
        <div className="flex justify-between">
          <h1 className="mb-6 text-2xl font-semibold">Shopping Cart</h1>
          {allCartItems.length > 0 && (
            <Button
              type="button"
              variant="destructive"
              // className="rounded-full  px-8 py-3 font-semibold text-white transition hover:bg-red-700"
              onClick={() => actions.clearCart()}
            >
              Clear All
            </Button>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-sm font-medium text-gray-700">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4 text-center">Quantity</th>
                <th className="px-6 py-4 text-center">Total</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {allCartItems.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    Your cart is empty.
                  </td>
                </tr>
              )}
              {allCartItems.map((item, idx) => (
                <tr
                  key={item.key}
                  className="border-b transition last:border-b-0 hover:bg-gray-50"
                >
                  <td className="flex items-center gap-4 px-6 py-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
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
                      <div className="text-xs text-gray-500">
                        {item.variant.name !== "Default" && (
                          <>
                            Set: {item.variant.name}
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
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-200"
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
                        -
                      </button>
                      <span className="w-10 text-center text-base font-medium">
                        {item.variant.quantity}
                      </span>
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-200"
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
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-lg font-semibold">
                    $
                    {(
                      (item.variant.price || 0) * (item.variant.quantity || 0)
                    ).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      type="button"
                      className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium transition hover:bg-red-500 hover:text-white"
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
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Summary */}
      <div className="w-full flex-shrink-0 md:w-96">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
          <div className="mb-4">
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
          </div>
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
              <span>{DELIVERY_FEE.toLocaleString()} USD</span>
            </div>
            <div className="my-2 border-t border-gray-200"></div>
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{total.toLocaleString()} USD</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <span>100% Limited Warranty as per manufacturer’s details</span>
          </div>
          <button
            type="button"
            className="mt-6 w-full rounded-full bg-black py-3 text-base font-semibold text-white transition hover:bg-gray-900"
          >
            Checkout Now
          </button>
        </div>
      </div>
    </div>
  );
}

export const CartExample = dynamic(() => Promise.resolve(CartPage), {
  ssr: false,
});
