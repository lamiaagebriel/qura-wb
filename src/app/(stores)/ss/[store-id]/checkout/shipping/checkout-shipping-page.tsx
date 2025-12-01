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

import { checkOrderShipping } from "@/servers/orders";
import { cn } from "@/lib/utils";

import { buttonVariants } from "@/components/ui/button";
import {
  Form,
  FormButton,
  FormInputField,
  FormTextareaField,
} from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
import { Link } from "@/components/ui/link";
import { useLocale } from "@/components/locale-provider";

type CheckoutPageProps = { store: Store; user: User };

function ShippingClient({ store: { id: storeId }, user }: CheckoutPageProps) {
  const cart = useCartStore();
  const actions = useCartActions();
  const selectors = useCartSelectors();
  const { cmn, db } = useLocale();

  const items = cart?.getProductsByStore(storeId);
  return (
    <Form
      infiniteLoading
      validation="check-order-shipping"
      onSubmit={async (data) => {
        const response = await checkOrderShipping(data);
        if (!response?.ok) return response;

        cart.setStoreShipping({
          storeId,
          shipping: { ...data },
        });

        return response;
      }}
      className="my-6 grid grid-cols-1 gap-6"
      useForm={{
        defaultValues: {
          storeId,
          userId: user?.id,

          notes: cart["cart"][storeId]?.shipping?.notes ?? "",
          address: cart["cart"][storeId]?.shipping?.address ?? [
            {
              name: cart["cart"][storeId]?.info?.name,
              phones: cart["cart"][storeId]?.info?.phones,
              shipping:
                cart["cart"][storeId]?.shipping?.address?.[0]?.shipping ?? 10, // Note: changes auto w the city
              street: "",
              city: "",
              state: "",
              country: "",
              postalCode: "",
            },
          ],
        },
      }}
    >
      <div className="space-y-2">
        <div className="space-y-2">
          {/* <div className="font-medium">Shipping address</div> */}
          {/* <FormInputField
            label={db["orders"]["address"]["name"]["name"]}
            field={{ name: "address.0.name" }}
          />
          <FormInputField
            label="Phones"
            field={{ name: "address.0.phones.0" }}
            type="tel"
          /> */}
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

        <div className="flex items-center justify-between gap-4">
          <Link
            href={`${Paths.Store}/${storeId}${Paths.StoreCheckout}`}
            className={cn(
              buttonVariants({
                variant: "ghost",
              })
            )}
          >
            <Icons.chevronLeft /> Return to Information
          </Link>

          <FormButton type="submit" size="lg" className="rounded-full py-6">
            {cmn["continue to shipping"]}
          </FormButton>
        </div>
      </div>
    </Form>
  );
}
export const Shipping = dynamic(() => Promise.resolve(ShippingClient), {
  ssr: false,
});
