"use client";

import dynamic from "next/dynamic";

import { Paths } from "@/constants";
import { Store } from "@/db/schema";
import {
  useCartActions,
  useCartSelectors,
  useCartStore,
} from "@/stores/cart-store";
import { User } from "lucia";

import { checkOrderPayment } from "@/servers/orders";
import { cn } from "@/lib/utils";
import { OrderPaymentMethod } from "@/lib/validations";

import { buttonVariants } from "@/components/ui/button";
import {
  Form,
  FormButton,
  FormField,
  FormInputField,
  FormItem,
  FormSelectField,
} from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
import { Link } from "@/components/ui/link";
import { useLocale } from "@/components/locale-provider";

type CheckoutPageProps = { store: Store; user: User };
function PaymentClient({ store: { id: storeId }, user }: CheckoutPageProps) {
  const cart = useCartStore();
  const actions = useCartActions();
  const selectors = useCartSelectors();
  const { cmn, db } = useLocale();

  const items = cart?.getProductsByStore(storeId);
  return (
    <Form
      infiniteLoading
      validation="check-order-payment"
      onSubmit={async (data) => {
        const response = await checkOrderPayment(data);
        if (!response?.ok) return response;

        cart.setStorePayment({
          storeId,
          payment: { ...data },
        });

        return response;
      }}
      className="my-6 grid grid-cols-1 gap-6"
      useForm={{
        defaultValues: {
          storeId,
          userId: user?.id,

          status: cart["cart"][storeId]?.payment?.status ?? "pending",
          actions: cart["cart"][storeId]?.payment?.actions ?? [
            { action: "order_initiated", actorId: user?.id },
            { action: "paying__cod", actorId: user?.id },
          ],
        },
      }}
    >
      <div className="space-y-2">
        <FormSelectField
          field={{ name: "actions.1.action" }}
          label={{
            children: db["orders"]["actions"]["action"]["payment method"],
            className: "sr-only",
          }}
          placeholder={
            db["orders"]["actions"]["action"]["select payment method..."]
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
                      db["orders"]["actions"]["action"]["enums"][key]?.color,
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

        <div className="flex items-center justify-between gap-4">
          <Link
            href={`${Paths.Store}/${storeId}${Paths.StoreCheckoutShipping}`}
            className={cn(
              buttonVariants({
                variant: "ghost",
              })
            )}
          >
            <Icons.chevronLeft /> Return to Shipping
          </Link>

          <FormButton type="submit" size="lg" className="rounded-full py-6">
            {cmn["continue to review"]}
          </FormButton>
        </div>
      </div>
    </Form>
  );
}

export const Payment = dynamic(() => Promise.resolve(PaymentClient), {
  ssr: false,
});
