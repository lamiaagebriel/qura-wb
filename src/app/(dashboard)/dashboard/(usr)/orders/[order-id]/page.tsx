import type { Metadata } from "next";
import { redirect } from "next/navigation";
import * as React from "react";

import { Paths } from "@/constants";
import { queries } from "@/db/queries";
import { getOrderNumbers } from "@/stores/cart-store";

import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";
import { cn, formatPrice } from "@/lib/utils";
import { OrderPaymentMethod } from "@/lib/validations";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { Link } from "@/components/ui/link";
import { Timeline, type TimelineItem } from "@/components/ui/timeline";

type OrderDetailProps = Readonly<{
  params: Promise<{ "order-id": string }>;
}>;

// Provide localized page title.
export const metadata = async (): Promise<Metadata> => {
  const dic = await getDictionary();
  const c = dic["dashboard"]["orders"]["order"];
  return { title: c["order details"] };
};

export default async function OrderDetails({ params }: OrderDetailProps) {
  const { "order-id": id } = await params;
  const dic = await getDictionary();
  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const c = dic["dashboard"]["orders"]["order"];
  const cmn = dic["cmn"];
  const dbOrder = dic?.db?.orders;
  const { data: order } = await queries.orders.get({ id });

  if (!order) {
    return (
      <main className="flex-1">
        <div className="container py-8">
          <h1 className="text-xl font-semibold">{c["order details"]}</h1>
          <div className="bg-destructive/10 text-destructive mt-6 rounded p-8 text-center">
            Order not found
          </div>
        </div>
      </main>
    );
  }
  const { subtotal, total, discountAmount, deliveryFee } = getOrderNumbers({
    products: order?.items ?? [],
    discount: order?.discount ?? undefined,
    shippingFee: order?.address?.[0]?.shipping,
  });

  // Localized order status label/color
  const statusEnum = dbOrder?.status?.enums?.[order?.status];
  const orderStatusLabel = statusEnum?.label ?? order.status;
  const orderStatusColor = statusEnum?.color;

  // Fetch users for all actors in actions
  const actorIds = Array.isArray(order.actions)
    ? [...new Set(order.actions.map((a) => a.actorId).filter(Boolean))]
    : [];
  const { data: actors = [] } =
    actorIds.length > 0
      ? await queries.users.getMany({ ids: actorIds })
      : { data: [] };
  const actorsMap = new Map(actors.map((a) => [a.id, a]));

  // Transform actions into timeline items
  const timelineItems: TimelineItem[] = [
    ...(Array.isArray(order.actions)
      ? order.actions.map((action: any, idx) => {
          const actor = action.actorId
            ? actorsMap.get(action.actorId)
            : undefined;
          let title = "";
          let description: React.ReactNode = "";
          let icon = <Icons.dot className="size-4" />;
          let data: Record<string, any> = {};

          if (action.action === "order_initiated") {
            title = "Order Initiated";
            description = "Order was initiated";
            icon = <Icons.shoppingBag className="size-4" />;
          } else if (action.action === "paying__cod") {
            const enumData =
              dbOrder?.actions?.action?.enums?.[
                action.action as OrderPaymentMethod
              ];
            title = enumData?.label || "Cash on Delivery";
            description = "Payment method selected";
            icon = (
              <Icons.dot
                className="size-4"
                style={{ backgroundColor: enumData?.color }}
              />
            );
          } else if (action.action === "paying__instapay") {
            const enumData =
              dbOrder?.actions?.action?.enums?.[
                action.action as OrderPaymentMethod
              ];
            title = enumData?.label || "Instapay";
            description = "Payment via Instapay";
            icon = (
              <Icons.dot
                className="size-4"
                style={{ backgroundColor: enumData?.color }}
              />
            );
            if (action.data) {
              data = {
                amount:
                  action.data.amount != null
                    ? formatPrice(action.data.amount)
                    : undefined,
                username: action.data.username,
              };
              // Remove undefined values
              Object.keys(data).forEach(
                (key) => data[key] === undefined && delete data[key]
              );
            }
          } else {
            const actionType = (action as { action?: string }).action;
            title = String(actionType || "Unknown Action");
            description = "Action performed";
          }

          return {
            id: `action-${idx}`,
            title,
            description,
            timestamp: order.createdAt, // Actions don't have timestamps, use order createdAt
            icon,
            actor: actor
              ? {
                  id: actor.id,
                  name: actor.name,
                  image: actor.image,
                  email: actor.email,
                }
              : undefined,
            data: Object.keys(data).length > 0 ? data : undefined,
          };
        })
      : []),
  ];

  return (
    <main className="flex-1">
      <div className="container py-8">
        <div className="mb-8 flex items-center gap-2">
          <Link
            href={Paths.Dashboard}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "size-7"
            )}
          >
            <Icons.chevronLeft />
            <span className="sr-only">{cmn["back"] ?? "Back"}</span>
          </Link>
          <h1 className="flex flex-1 items-center gap-2 text-xl font-semibold tracking-tight">
            <Icons.dot
              style={{ backgroundColor: orderStatusColor }}
              className="w-6"
            />{" "}
            {c["order details"]} #{order?.id}
          </h1>
          {/* <Badge variant="outline">
            <div className="flex items-center gap-2">
              <Icons.dot style={{ backgroundColor: orderStatusColor }} />
              {orderStatusLabel}
            </div>
          </Badge> */}
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm font-medium uppercase">
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timelineItems.length > 0 ? (
                <Timeline items={timelineItems} />
              ) : (
                <div className="text-muted-foreground">
                  No actions recorded.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-medium uppercase">
                  {c["order info"]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{c["order ID"]}:</span>{" "}
                    <span className="font-mono">{order.id}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{c["date"]}:</span>{" "}
                    <span>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{c["status"]}:</span>{" "}
                    <Badge variant="outline">
                      <span className="flex items-center gap-2">
                        <Icons.dot
                          style={{ backgroundColor: orderStatusColor }}
                        />
                        {orderStatusLabel}
                      </span>
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{c["total"]}:</span>{" "}
                    <span className="font-mono">{formatPrice(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-medium uppercase">
                  {c["customer"]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.address?.[0] ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{c["name"]}:</span>{" "}
                      {order.address[0].name ?? "-"}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{c["phone"]}:</span>{" "}
                      {order.address[0].phones && order.address[0].phones.length
                        ? order.address[0].phones.join(", ")
                        : "-"}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{c["street"]}:</span>{" "}
                      {order.address[0].street || "-"}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{c["city"]}:</span>{" "}
                      {order.address[0].city || "-"}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{c["state"]}:</span>{" "}
                      {order.address[0].state || "-"}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{c["country"]}:</span>{" "}
                      {order.address[0].country || "-"}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{c["postalCode"]}:</span>{" "}
                      {order.address[0].postalCode || "-"}
                    </div>
                    {order.address[0].coordinates && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">
                          {c["coordinates"]}:
                        </span>{" "}
                        <span>
                          {order.address[0].coordinates.latitude != null
                            ? `Lat: ${order.address[0].coordinates.latitude}`
                            : ""}
                          {order.address[0].coordinates.latitude != null &&
                          order.address[0].coordinates.longitude != null
                            ? ", "
                            : ""}
                          {order.address[0].coordinates.longitude != null
                            ? `Lng: ${order.address[0].coordinates.longitude}`
                            : ""}
                          {order.address[0].coordinates.latitude == null &&
                            order.address[0].coordinates.longitude == null &&
                            "-"}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    {c["no customer info"]}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-medium uppercase">
                  {c["items"]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.items &&
                Array.isArray(order.items) &&
                order.items.length > 0 ? (
                  <div className="space-y-4">
                    {order.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-1 rounded border p-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {item.title ||
                              item.name ||
                              c["product"] ||
                              "Product"}
                          </span>
                          {item.sku && (
                            <span className="text-muted-foreground text-xs">
                              #{item.sku}
                            </span>
                          )}
                          {item.quantity && (
                            <span className="ml-auto">× {item.quantity}</span>
                          )}
                        </div>
                        {/* Show item attributes if present */}
                        {Array.isArray(item.attributes) &&
                          item.attributes.length > 0 && (
                            <div className="space-y-1 pl-2 text-xs">
                              {item.attributes.map(
                                (attr: any, aidx: number) => (
                                  <div
                                    key={aidx}
                                    className="flex items-center justify-between gap-2"
                                  >
                                    <span>
                                      {attr.title || attr.name}
                                      {attr.value ? (
                                        <>
                                          :{" "}
                                          <span className="font-mono">
                                            {attr.value}
                                          </span>
                                        </>
                                      ) : null}
                                    </span>
                                    {attr.price ? (
                                      <span className="ml-auto font-mono">
                                        {formatPrice(attr.price)}
                                      </span>
                                    ) : null}
                                    {typeof attr.quantity !== "undefined" ? (
                                      <span>×{attr.quantity}</span>
                                    ) : null}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground">{c["no items"]}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-medium uppercase">
                  {c["summary"]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span>{c["items total"]}:</span>
                    <span className="font-mono">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>{c["shipping"]}:</span>
                    <span className="font-mono">
                      {formatPrice(deliveryFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>{c["discount"]}:</span>
                    <span className="font-mono">
                      {formatPrice(discountAmount)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2 font-semibold">
                    <span>{c["total"]}:</span>
                    <span className="font-mono">{formatPrice(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
