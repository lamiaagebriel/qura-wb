import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";
import {
  Check,
  CheckCheck,
  Clock,
  DollarSign,
  Edit,
  Home,
  RefreshCw,
  ShoppingBag,
  Truck,
  Verified,
  X,
} from "lucide-react";

import { queries } from "@/servers/db/queries";
import { Order as OrderType } from "@/servers/db/schema";
import { getDictionary } from "@/servers/locale";
import { updateOrder } from "@/servers/orders";
import { getAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormAlertDialogButton,
  FormButton,
  FormInputField,
  FormResetButton,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  EmptyPlaceholder,
  EmptyPlaceholderDescription,
  EmptyPlaceholderIcon,
  EmptyPlaceholderTitle,
} from "@/components/empty-placeholder";
import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { OrderForm } from "@/components/order-form";

type OrderProps = Readonly<{
  params: Promise<{ "store-id": string; "order-id": string }>;
}>;
export const metadata: Metadata = { title: "Order" };
export default async function Order({ params }: OrderProps) {
  const { "store-id": storeId, "order-id": orderId } = await params;

  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const {
    stores: {
      store: {
        orders: { order: c },
      },
    },
    db: { orders: pp },
    cmn,
  } = await getDictionary();

  const { data: selectedOrder } = await queries.orders.get({
    id: orderId,
  });

  if (!selectedOrder)
    return (
      <main className="flex-1">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="container max-w-screen-sm py-4">
            <EmptyPlaceholder className="border-none">
              <EmptyPlaceholderIcon name="inbox" />
              <EmptyPlaceholderTitle>لا يوجد بيانات.</EmptyPlaceholderTitle>
              <EmptyPlaceholderDescription>
                تحاول الآن الوصول إلي بيانات غير موجودة في خوادمنا.
              </EmptyPlaceholderDescription>

              <Link
                href={`/ss/${storeId}/orders`}
                className={cn(buttonVariants({ size: "lg" }))}
              >
                <Icons.shirt />
                <span>جميع الطلبات</span>
              </Link>
            </EmptyPlaceholder>
          </div>
        </div>
      </main>
    );

  const subtotal = selectedOrder?.total;
  const summaryFields = [
    {
      label: "Subtotal",
      value: <>{subtotal} USD</>,
    },
    { label: "Discount (10%)", value: <>-1.50 USD</> },
    { label: "Delivery Fee", value: <>10.00 USD</> },
    {
      label: "Total",
      value: <>{(Number.parseFloat(subtotal) + 10.0 - 1.5).toFixed(2)} USD</>,
    },
  ];

  console.log(selectedOrder);

  return (
    <main className="flex-1">
      <div className="container py-4">
        <Form
          validation="update-order"
          onSubmit={updateOrder}
          useForm={{
            defaultValues: { ...selectedOrder },
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link
                href={`/ss/${storeId}/orders`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "size-7"
                )}
              >
                <Icons.chevronLeft />
                <span className="sr-only">{cmn["back"]}</span>
              </Link>

              <h1 className="flex-1 text-xl font-semibold tracking-tight">
                {c["order details"]} #{selectedOrder?.id}
              </h1>
              <Badge variant="outline">
                <div className="flex items-center gap-2">
                  <Icons.dot
                    style={{
                      backgroundColor:
                        pp["status"]["enums"][selectedOrder?.status]?.color,
                    }}
                  />
                  {pp["status"]["enums"][selectedOrder?.status]?.label}
                </div>
              </Badge>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <div className="flex items-center gap-2">
                <FormResetButton variant="outline" size="sm">
                  {cmn["discard"]}
                </FormResetButton>
                <FormButton type="submit" size="sm">
                  {cmn["save changes"]}
                </FormButton>
              </div>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-[1fr,250px] lg:grid-cols-3 lg:gap-4">
            <div className="grid auto-rows-max items-start gap-2 lg:col-span-2 lg:gap-4">
              <OrderActionsTimeline />
            </div>

            <div className="grid auto-rows-max items-start gap-2 lg:gap-4">
              {/* <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                    {c["order status"]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <OrderForm.status />
                  </div>
                </CardContent>
              </Card> */}

              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Table>
                    <TableBody>
                      {summaryFields?.map((e, i) => (
                        <TableRow
                          key={i}
                          className="[&:not(:nth-child(3))]:border-none"
                        >
                          <TableCell className="font-medium">
                            {e?.label}
                          </TableCell>
                          <TableCell className="text-right">
                            {e?.value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle>Order Address</CardTitle>

                  <FormAlertDialogButton
                    trigger={{
                      variant: "outline",
                      children: selectedOrder?.shippingAddress ? "edit" : "add",
                    }}
                    title="Are you absolutely sure?"
                    description="This action cannot be undone. This will permanently delete your account and remove your data from our servers."
                    form={{
                      validation: "cart-address-schema",
                      onSubmit: updateOrder,
                      useForm: {
                        defaultValues: { ...selectedOrder?.shippingAddress },
                      },
                      className: "space-y-2",
                    }}
                  >
                    <FormInputField
                      field={{ name: "name" }}
                      label="Full Name"
                    />
                    <FormInputField field={{ name: "phone" }} label="Phone" />
                    <FormInputField
                      field={{ name: "address_line" }}
                      label="Address Line"
                    />
                    <FormInputField field={{ name: "zip" }} label="Zip" />

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <FormInputField field={{ name: "state" }} label="State" />
                      <FormInputField field={{ name: "city" }} label="City" />
                      <FormInputField
                        field={{ name: "country" }}
                        label="Country"
                      />
                    </div>
                  </FormAlertDialogButton>
                </CardHeader>

                <CardContent>
                  <Table>
                    <TableBody>
                      {Object.entries(
                        selectedOrder?.shippingAddress ?? {}
                      )?.map(([key, value], i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{key}</TableCell>
                          <TableCell className="text-right">
                            {typeof value === "string"
                              ? value
                              : JSON.stringify(value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 md:hidden">
            <div className="flex items-center gap-2">
              <FormResetButton variant="outline" size="sm">
                {cmn["discard"]}
              </FormResetButton>
              <FormButton type="submit" size="sm">
                {cmn["save changes"]}
              </FormButton>
            </div>
          </div>
        </Form>
      </div>
    </main>
  );
}

const OrderActionsTimeline = () => {
  // Sample data - in a real app, this would be passed as props
  const actions = [
    {
      action: "PENDING",
      actorId: "user123",
      note: "Order placed",
      createdAt: new Date("2025-02-20T10:30:00"),
    },
    {
      action: "CONFIRMED",
      actorId: "admin456",
      note: "Order confirmed",
      createdAt: new Date("2025-02-20T11:15:00"),
    },
    {
      action: "PAID",
      actorId: "user123",
      note: "Payment received",
      createdAt: new Date("2025-02-20T11:20:00"),
    },
    {
      action: "PROCESSING_STARTED",
      actorId: "staff789",
      note: "Started preparing items",
      createdAt: new Date("2025-02-21T09:00:00"),
    },
    {
      action: "PROCESSING_ENDED",
      actorId: "staff789",
      note: "Items ready for shipping",
      createdAt: new Date("2025-02-21T14:30:00"),
    },
    {
      action: "SHIPPING_STARTED",
      actorId: "ship001",
      note: "Package in transit",
      createdAt: new Date("2025-02-22T08:45:00"),
    },
    {
      action: "ITEMS",
      actorId: "admin456",
      note: "Added extra item per customer request",
      createdAt: new Date("2025-02-22T10:15:00"),
    },
  ];

  // Function to get the appropriate icon for each action type
  const getActionIcon = (
    action:
      | "PENDING"
      | "CONFIRMED"
      | "PAID"
      | "PROCESSING_STARTED"
      | "PROCESSING_ENDED"
      | "SHIPPING_STARTED"
      | "SHIPPING_ENDED"
      | "CANCELLED"
      | "REFUNDED"
      | "TOTAL"
      | "ITEMS"
      | "SHIPPING_ADDRESS"
  ) => {
    switch (action) {
      case "PENDING":
        return <Clock className="size-4" />;
      case "CONFIRMED":
        return <CheckCheck className="size-4" />;
      case "PAID":
        return <DollarSign className="size-4" />;
      case "PROCESSING_STARTED":
      case "PROCESSING_ENDED":
        return <RefreshCw className="size-4" />;
      case "SHIPPING_STARTED":
      case "SHIPPING_ENDED":
        return <Truck className="size-4" />;
      case "CANCELLED":
        return <X className="size-4" />;
      case "REFUNDED":
        return <DollarSign className="size-4" />;
      case "TOTAL":
        return <DollarSign className="size-4" />;
      case "ITEMS":
        return <ShoppingBag className="size-4" />;
      case "SHIPPING_ADDRESS":
        return <Home className="size-4" />;
      default:
        return <Edit className="size-4" />;
    }
  };

  // Function to get the color class for the badge
  const getActionColor = (
    action:
      | "PENDING"
      | "CONFIRMED"
      | "PAID"
      | "PROCESSING_STARTED"
      | "PROCESSING_ENDED"
      | "SHIPPING_STARTED"
      | "SHIPPING_ENDED"
      | "CANCELLED"
      | "REFUNDED"
      | "TOTAL"
      | "ITEMS"
      | "SHIPPING_ADDRESS"
  ) => {
    const colorMap = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      PAID: "bg-green-100 text-green-800",
      PROCESSING_STARTED: "bg-purple-100 text-purple-800",
      PROCESSING_ENDED: "bg-purple-100 text-purple-800",
      SHIPPING_STARTED: "bg-indigo-100 text-indigo-800",
      SHIPPING_ENDED: "bg-indigo-100 text-indigo-800",
      CANCELLED: "bg-red-100 text-red-800",
      REFUNDED: "bg-orange-100 text-orange-800",
      TOTAL: "bg-gray-100 text-gray-800",
      ITEMS: "bg-cyan-100 text-cyan-800",
      SHIPPING_ADDRESS: "bg-emerald-100 text-emerald-800",
    };

    return colorMap?.[action] || "bg-gray-100 text-gray-800";
  };

  // Function to format dates
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Function to get actor initials
  const getActorInitials = (actorId: string) => {
    return actorId.slice(0, 2).toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Actions Timeline</CardTitle>
        <CardDescription>Tracking history and state changes</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-3.5 before:h-full before:w-0.5 before:bg-gray-200">
          {actions
            .sort((a, b) => b.createdAt?.getTime() - a.createdAt?.getTime())
            .map((action, index) => (
              <div key={index} className="relative flex items-start gap-4">
                <div
                  className={cn(
                    "relative flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow",
                    getActionColor(action.action as any)
                  )}
                >
                  {getActionIcon(action.action as any)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">
                      {action.action.replace(/_/g, " ")}
                    </h2>
                    <time className="text-xs text-muted-foreground">
                      {formatDate(action.createdAt)}
                    </time>
                  </div>

                  <div className="flex items-start justify-between">
                    <p className="text-sm text-gray-600">{action.note}</p>

                    <div className="flex items-center space-x-2">
                      <Tooltip tip={<p>Actor ID: {action.actorId}</p>}>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-gray-100 text-xs text-gray-600">
                            {getActorInitials(action.actorId)}
                          </AvatarFallback>
                        </Avatar>
                      </Tooltip>
                      <span className="text-xs text-gray-500">
                        by {action.actorId}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};
