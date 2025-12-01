"use client";

import dynamic from "next/dynamic";

import { Paths } from "@/constants";
import { Store } from "@/db/schema";
import { useCartStore } from "@/stores/cart-store";
import { User } from "lucia";

import { createOrder } from "@/servers/orders";
import { cn, formatPrice } from "@/lib/utils";

import { buttonVariants } from "@/components/ui/button";
import { Form, FormButton } from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
import { Link } from "@/components/ui/link";
import { useLocale } from "@/components/locale-provider";

type CheckoutPageProps = { store: Store; user: User };
function ReviewClient({ store: { id: storeId }, user }: CheckoutPageProps) {
  const cart = useCartStore();
  const { cmn, db } = useLocale();

  const storeCart = cart?.cart?.[storeId] || {};
  const items = Array.isArray(cart?.getProductsByStore(storeId))
    ? cart.getProductsByStore(storeId)
    : [];

  // Defensive shipping address
  const shippingAddress =
    Array.isArray(storeCart?.shipping?.address) && storeCart.shipping.address[0]
      ? storeCart.shipping.address[0]
      : {
          name: storeCart?.info?.name || "",
          phones: storeCart?.info?.phones || [],
          street: "",
          city: "",
          state: "",
          country: "",
          postalCode: "",
          shipping: null,
        };

  const paymentStatus =
    (typeof storeCart?.payment?.status === "string"
      ? storeCart.payment.status
      : "") || "Not selected";

  // Payment option details: cod or instapay (amount, username)
  let paymentOptionLabel = "Not selected";
  /**
   * Handle payment details extraction for rendering order review/payment summary
   * from the payment actions array in storeCart.payment.
   */
  let paymentAction = undefined;
  let paymentDetails: any = undefined;

  if (
    Array.isArray(storeCart?.payment?.actions) &&
    storeCart.payment.actions.length > 1
  ) {
    paymentAction = storeCart.payment.actions[1];
    const action = paymentAction;

    if (action && typeof action === "object" && "action" in action) {
      if (action.action === "paying__cod") {
        paymentOptionLabel = "Cash on Delivery";
        paymentDetails = { type: "cod" };
      } else if (action.action === "paying__instapay") {
        paymentOptionLabel = "InstaPay";
        paymentDetails = {
          type: "instapay",
          amount: action.data?.amount ?? undefined,
          username: action.data?.username ?? undefined,
        };
      }
    }
  }

  const notes =
    typeof storeCart?.shipping?.notes === "string"
      ? storeCart.shipping.notes
      : "";

  return (
    <Form
      infiniteLoading
      validation="create-order"
      onSubmit={async (data) => {
        const response = await createOrder(data);
        if (!response?.ok) return response;

        cart?.clearStoreCart(storeId);
        return response;
      }}
      className="my-6 grid grid-cols-1 gap-6"
      useForm={{
        defaultValues: {
          storeId,
          userId: user?.id,

          discount: cart["cart"][storeId]?.discount,
          status: cart["cart"][storeId]?.payment?.status,
          address: cart["cart"][storeId]?.shipping?.address,
          items: cart["cart"][storeId]?.info?.items,
          actions: cart["cart"][storeId]?.payment?.actions,
          notes: cart["cart"][storeId]?.shipping?.notes,
        },
      }}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-medium">Review Your Order</h2>
          <p className="text-muted-foreground text-sm">
            Please review your order details before placing your order.
          </p>
        </div>

        <div className="space-y-4">
          {/* SHIPPING ADDRESS */}
          <div>
            <div className="mb-1 font-medium">Shipping Address</div>
            <div className="space-y-1 rounded-lg border p-4 text-sm">
              <div>
                <span className="font-semibold">Name:</span>{" "}
                {shippingAddress?.name || (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              <div>
                <span className="font-semibold">Phones:</span>{" "}
                {Array.isArray(shippingAddress?.phones) &&
                shippingAddress.phones.length > 0
                  ? shippingAddress.phones.filter(Boolean).join(" / ")
                  : shippingAddress?.phones || (
                      <span className="text-muted-foreground">—</span>
                    )}
              </div>
              <div>
                <span className="font-semibold">Street:</span>{" "}
                {shippingAddress?.street || (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              <div>
                <span className="font-semibold">City:</span>{" "}
                {shippingAddress?.city || (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              <div>
                <span className="font-semibold">State:</span>{" "}
                {shippingAddress?.state || (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              <div>
                <span className="font-semibold">Country:</span>{" "}
                {shippingAddress?.country || (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              <div>
                <span className="font-semibold">Postal Code:</span>{" "}
                {shippingAddress?.postalCode || (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>

          {/* PAYMENT */}
          <div>
            <div className="mb-1 font-medium">Payment Method</div>
            <div className="flex flex-col gap-1 rounded-lg border p-4 text-sm">
              <span>
                <span className="font-semibold">Status:</span> {paymentStatus}
              </span>
              {/* Display payment details */}
              {paymentDetails ? (
                <div className="mt-1 flex flex-col gap-1">
                  <span>
                    <span className="font-semibold">Type:</span>{" "}
                    {paymentDetails.type || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                  {paymentDetails.provider && (
                    <span>
                      <span className="font-semibold">Provider:</span>{" "}
                      {paymentDetails.provider}
                    </span>
                  )}

                  {paymentDetails.username && (
                    <span>
                      <span className="font-semibold">Username:</span>{" "}
                      {paymentDetails.username}
                    </span>
                  )}
                  {paymentDetails.amount && (
                    <span>
                      <span className="font-semibold">Details:</span>{" "}
                      {formatPrice(paymentDetails.amount)}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>

          {/* NOTES */}
          {!!notes && (
            <div>
              <div className="mb-1 font-medium">Notes</div>
              <div className="rounded-lg border p-4 text-sm">{notes}</div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`${Paths.Store}/${storeId}${Paths.StoreCheckoutPayment}`}
            className={cn(
              buttonVariants({
                variant: "ghost",
              })
            )}
          >
            <Icons.chevronLeft /> Return to Payment
          </Link>

          <FormButton type="submit" size="lg" className="rounded-full py-6">
            {cmn?.["place order"]}
          </FormButton>
        </div>
      </div>
    </Form>
  );
}
export const Review = dynamic(() => Promise.resolve(ReviewClient), {
  ssr: false,
});
