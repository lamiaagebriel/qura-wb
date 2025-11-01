"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import * as React from "react";

import { Store } from "@/db/schema";
import {
  useCartActions,
  useCartSelectors,
  useCartStore,
} from "@/stores/cart-store";
import { User } from "lucia";

import { createOrder } from "@/servers/orders";
import { OrderPaymentMethod } from "@/lib/validations";

import {
  Form,
  FormButton,
  FormField,
  FormInputField,
  FormItem,
  FormSelectField,
  FormTextareaField,
} from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
import { useLocale } from "@/components/locale-provider";

type CheckoutPageProps = { store: Store; user: User };

function CheckoutPage({ store, user }: CheckoutPageProps) {
  const storeId = store?.id;
  const cart = useCartStore();
  const actions = useCartActions();
  const selectors = useCartSelectors();
  const { cmn, db } = useLocale();
  const [step, setStep] = React.useState<number>(0);

  // Hardcoded values for demo
  const DELIVERY_FEE = 10;
  const DISCOUNT = 50;

  // Flatten all products for all stores for the table
  const allCheckoutItems = Object.keys(cart.cart).flatMap((storeId) => {
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
  const subTotal = allCheckoutItems.reduce(
    (sum, item) =>
      sum + (item.variant.price || 0) * (item.variant.quantity || 0),
    0
  );
  const total = subTotal - DISCOUNT + DELIVERY_FEE;

  return (
    <div className="container grid max-w-5xl! md:grid-cols-2">
      <div className="flex min-w-0 flex-1 flex-col gap-8 px-8 py-10">
        {/* Store logo / title */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border bg-gray-200">
            {store.logo ? (
              <Image
                src={store.logo}
                alt={store.name}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            ) : (
              <Icons.store className="text-muted-foreground size-6" />
            )}
          </div>
          <span className="text-xl font-semibold">{store.name}</span>
        </div>

        <Form
          // infiniteLoading
          validation="create-order"
          onSubmit={createOrder}
          className="grid grid-cols-1 gap-6"
          useForm={{
            defaultValues: {
              storeId,
              userId: user?.id,
              status: "pending",
              items: cart?.getProductsByStore(storeId),
              expenses: { shipping: DELIVERY_FEE, discount: DISCOUNT },
              actions: [
                { action: "order_initiated", actorId: user?.id },
                { action: "paying__cod", actorId: user?.id },
              ],
            },
          }}
        >
          <div className="space-y-2">
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <div className="font-medium">Shipping Address</div>
                  <FormInputField
                    label={db["orders"]["address"]["name"]["name"]}
                    field={{ name: "address.0.name" }}
                  />
                  <FormInputField
                    label="Phones"
                    field={{ name: "address.0.phones.0" }}
                    type="tel"
                  />
                  <FormInputField
                    label={db["orders"]["address"]["street"]["street"]}
                    field={{ name: "address.0.street" }}
                  />
                  <FormInputField
                    label={db["orders"]["address"]["city"]["city"]}
                    field={{ name: "address.0.city" }}
                  />
                  <FormInputField
                    label={db["orders"]["address"]["state"]["state"]}
                    field={{ name: "address.0.state" }}
                  />
                  <FormInputField
                    label={db["orders"]["address"]["country"]["country"]}
                    field={{ name: "address.0.country" }}
                  />
                  <FormInputField
                    label={db["orders"]["address"]["postalCode"]["postalCode"]}
                    field={{ name: "address.0.postalCode" }}
                  />
                </div>

                <FormTextareaField
                  label="Additional Notes"
                  field={{ name: "notes" }}
                  rows={3}
                />

                <FormButton
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full"
                >
                  {cmn["next step"]}
                </FormButton>
              </>
            )}
            {step === 1 && (
              <>
                <FormSelectField
                  field={{ name: "actions.1.action" }}
                  label={db["orders"]["actions"]["action"]["payment method"]}
                  placeholder={
                    db["orders"]["actions"]["action"][
                      "select payment method..."
                    ]
                  }
                  items={(
                    Object.keys(
                      db["orders"]["actions"]["action"]["enums"]
                    ) as OrderPaymentMethod[]
                  )?.map((key) => ({
                    value: key,
                    children: (
                      <div className="flex items-center gap-2">
                        <Icons.dot
                          style={{
                            backgroundColor:
                              db["orders"]["actions"]["action"]["enums"][key]
                                ?.color,
                          }}
                        />
                        {db["orders"]["actions"]["action"]["enums"][key]?.label}
                      </div>
                    ),
                  }))}
                />

                <FormField
                  name="actions.1.action"
                  render={({ field }) => (
                    <FormItem>
                      {field?.value === "paying__instapay" && (
                        <div className="mt-4 space-y-2">
                          <FormInputField
                            label="Amount (EGP)"
                            field={{ name: "actions.1.data.amount" }}
                            type="number"
                            min={1}
                          />
                          <FormInputField
                            label={
                              <>
                                InstaPay Username Paid To
                                <span className="text-muted-foreground ml-2 text-xs">
                                  (should be <b>+201022184878</b>)
                                </span>
                              </>
                            }
                            field={{ name: "actions.1.data.username" }}
                            placeholder="qura@instapay"
                          />
                        </div>
                      )}
                    </FormItem>
                  )}
                />
                <FormButton type="submit" className="w-full">
                  {cmn["place order"]}
                </FormButton>
              </>
            )}
          </div>
        </Form>
      </div>

      <div className="relative">
        <div className="bg-muted sticky top-4 bottom-4 container flex flex-col gap-7 rounded-md border-l py-8 md:w-sm!">
          <div>
            <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
            <div className="space-y-5">
              {allCheckoutItems.map((item, idx) => (
                <div className="flex items-center gap-3" key={item.key}>
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border bg-gray-100">
                    <Image
                      src={item.image}
                      width={56}
                      height={56}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
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
                    <div className="text-muted-foreground text-xs">
                      x{item.variant.quantity}
                    </div>
                  </div>
                  <div className="min-w-[60px] text-right text-base font-medium">
                    $
                    {(
                      item.variant.price * item.variant.quantity
                    ).toLocaleString()}
                  </div>
                </div>
              ))}
              {allCheckoutItems.length === 0 && (
                <div className="text-muted-foreground py-7 text-center text-sm">
                  Nothing in cart
                </div>
              )}
            </div>
          </div>
          <div className="border-b"></div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{subTotal.toLocaleString()} USD</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span className="text-green-700">
                -{DISCOUNT.toLocaleString()} USD
              </span>
            </div>
            <div className="flex justify-between">
              <span>Delivery fee</span>
              <span>{DELIVERY_FEE.toLocaleString()} USD</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t pt-3 text-base font-bold">
            <span>Total</span>
            <span>{total.toLocaleString()} USD</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const CheckoutExample = dynamic(() => Promise.resolve(CheckoutPage), {
  ssr: false,
});
