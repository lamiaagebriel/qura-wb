"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput, Verified } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Store } from "@/servers/db/schema";
import { useCart } from "@/lib/redux";
import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, DataTableProvider } from "@/components/ui/data-table";
import {
  Form,
  FormAlertDialogButton,
  FormControl,
  FormField,
  FormInputField,
  FormItem,
  FormLabel,
  FormMessage,
  FormSelectField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EmptyPlaceholder,
  EmptyPlaceholderDescription,
  EmptyPlaceholderIcon,
  EmptyPlaceholderTitle,
} from "@/components/empty-placeholder";
import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { useLocale } from "@/components/locale-provider";

import { columns } from "./columns";

type CartPageProps = { store: Pick<Store, "id"> };
export default function CartPage({ store }: CartPageProps) {
  const cart = useCart();
  const {} = useLocale();

  const [loading, setLoading] = React.useState<boolean>(false);
  const [crrStage, setCrrStage] = React.useState<number>(0);
  const stages = [
    { value: "summary", label: "Order Summary", content: <OrderSummary /> },
    {
      value: "address",
      label: "Order Address",
      content: <CartAddressButton />,
    },
    {
      value: "payment-method",
      label: "Payment Method",
      content: <OrderPaymentMethod />,
    },
  ];

  async function onCheckout() {
    console.log({
      storeId: cart?.products?.[0]?.product?.storeId,
      status: "PENDING",
      details: {
        products: cart?.products?.map((e) => ({
          productId: e?.product?.id,
          price: e?.product?.price,
          quantity: e?.quantity,
          attributes: e?.attributes,
        })),
        address: cart?.address!,
        paymentMethod: cart?.["payment-method"] ?? "cash",
      },
    });

    // try {
    // 	setLoading(true);
    // const data = {
    // 	storeId: cart?.products?.[0]?.product?.storeId,
    // 	status: "PENDING",
    // 	details: {
    // 		products: cart?.products?.map((e) => ({
    // 			productId: e?.product?.id,
    // 			price: e?.product?.price,
    // 			quantity: e?.quantity,
    // 			attributes: e?.attributes,
    // 		})),
    // 		address: cart?.address!,
    // 		paymentMethod: cart?.["payment-method"] ?? "cash",
    // 	},
    // } satisfies z.infer<typeof orderCreateSchema>;
    // 	await orderCreateSchema.parse(data);
    // 	const result = await createOrder(data);
    // 	if (result && typeof result === "object" && "error" in result) {
    // 		toast.error(result?.error);
    // 		return;
    // 	}
    // 	toast.success("created successfully.");
    // 	cart.clear();
    // 	// router.push(`/dashboard/o/${}`);
    // } catch (err: any) {
    // 	toast.error(err?.message);
    // } finally {
    // 	setLoading(false);
    // }
  }

  const isLast = crrStage === stages?.length - 1;

  if (!cart?.products?.length)
    return (
      <main className="flex-1">
        <div className="container flex flex-col gap-4 py-4">
          <EmptyPlaceholder className="flex-1">
            <EmptyPlaceholderIcon name="inbox" />
            <EmptyPlaceholderTitle>Empty Cart</EmptyPlaceholderTitle>
            <EmptyPlaceholderDescription>
              Lorem ipsum, dolor sit amet consectetur adipisicing elit. Optio,
              atque voluptatum.
            </EmptyPlaceholderDescription>
            <Link href={`/s/${store?.id}`} className={cn(buttonVariants({}))}>
              <Icons.shirt />
              Go Shopping
            </Link>
          </EmptyPlaceholder>
        </div>
      </main>
    );
  return (
    <main className="flex-1">
      <div className="container flex flex-col gap-4 py-4">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr,0.5fr] lg:gap-4">
          <div>
            <DataTableProvider data={cart?.products} columns={columns}>
              <Card className="p-0">
                <DataTable />
              </Card>
              {/* <DataTablePagination
              totalItems={
                tabs?.find((e) => e?.value === "ALL")?.total ??
                links?.length
              }
            /> */}
            </DataTableProvider>
          </div>

          <Tabs value={stages?.[crrStage]?.value}>
            <TabsList className="w-full">
              {stages?.map((e, i) => (
                <TabsTrigger
                  key={i}
                  disabled={i > crrStage}
                  value={e?.value}
                  className="w-full"
                >
                  {e?.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="my-2 flex items-center justify-between gap-4">
              <Button
                variant="outline"
                disabled={crrStage == 0 || loading}
                onClick={() => setCrrStage((pre) => pre - 1)}
              >
                Previous
              </Button>
              {!isLast ? (
                <Button
                  className="gap-4"
                  onClick={() => setCrrStage((pre) => pre + 1)}
                  disabled={
                    (crrStage === 1 && !cart?.address) ||
                    (crrStage === 2 && !cart?.["payment-method"]) ||
                    loading
                  }
                >
                  Next
                  <Icons.chevronRight />
                </Button>
              ) : null}
            </div>
            {stages?.map((e, i) => (
              <TabsContent key={i} value={e?.value}>
                {e?.content}

                {isLast && (
                  <Button
                    size="lg"
                    className="mt-4 w-full gap-4 rounded-full"
                    onClick={onCheckout}
                    disabled={!cart?.["payment-method"] || loading}
                  >
                    {loading && <Icons.spinner />}
                    Checkout
                  </Button>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </main>
  );
}

const PAYMENT_METHODS: any[] = [
  {
    value: "CASH",
    children: "Cash",
    disabled: false,
  },
  {
    value: "PAYPAL",
    children: "Paypal",
    disabled: true,
  },
];
const EGYPT_CITIES: any[] = [
  { value: "Alexandria", children: "Alexandria", disabled: false },
  { value: "Aswan", children: "Aswan", disabled: true },
  { value: "Asyut", children: "Asyut", disabled: false },
  { value: "Beheira", children: "Beheira", disabled: true },
  { value: "Beni Suef", children: "Beni Suef", disabled: true },
  { value: "Cairo", children: "Cairo", disabled: false },
  { value: "Dakahlia", children: "Dakahlia", disabled: false },
  { value: "Damietta", children: "Damietta", disabled: true },
  { value: "Faiyum", children: "Faiyum", disabled: true },
  { value: "Gharbia", children: "Gharbia", disabled: false },
  { value: "Giza", children: "Giza", disabled: false },
  { value: "Ismailia", children: "Ismailia", disabled: false },
  { value: "Kafr El Sheikh", children: "Kafr El Sheikh", disabled: true },
  { value: "Luxor", children: "Luxor", disabled: true },
  { value: "Matruh", children: "Matruh", disabled: true },
  { value: "Minya", children: "Minya", disabled: true },
  { value: "Monufia", children: "Monufia", disabled: false },
  { value: "New Valley", children: "New Valley", disabled: true },
  { value: "North Sinai", children: "North Sinai", disabled: true },
  { value: "Port Said", children: "Port Said", disabled: true },
  { value: "Qalyubia", children: "Qalyubia", disabled: false },
  { value: "Qena", children: "Qena", disabled: false },
  { value: "Red Sea", children: "Red Sea", disabled: true },
  { value: "Sharqia", children: "Sharqia", disabled: true },
  { value: "Sohag", children: "Sohag", disabled: false },
  { value: "South Sinai", children: "South Sinai", disabled: false },
  { value: "Suez", children: "Suez", disabled: false },
];

const COUNTRIES: any[] = [
  { value: "Egypt", children: "Egypt", disabled: false },
  { value: "Saudi Arabia", children: "Saudi Arabia", disabled: true },
  { value: "Iran", children: "Iran", disabled: true },
  { value: "Iraq", children: "Iraq", disabled: true },
  {
    value: "United Arab Emirates",
    children: "United Arab Emirates",
    disabled: true,
  },
  { value: "Jordan", children: "Jordan", disabled: true },
  { value: "Lebanon", children: "Lebanon", disabled: true },
  { value: "Kuwait", children: "Kuwait", disabled: true },
  { value: "Qatar", children: "Qatar", disabled: true },
  { value: "Bahrain", children: "Bahrain", disabled: true },
  { value: "Oman", children: "Oman", disabled: true },
];
function OrderSummary() {
  const storeId = "sx";
  const cart = useCart();
  const subtotal = cart?.products
    ?.reduce(
      (acc, crr) => acc + Number(crr?.product?.price! ?? "0") * crr?.quantity,
      0
    )
    .toFixed(2);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Discount Voucher"
            className="w-full rounded-full"
          />
          <Button variant="outline" className="rounded-full">
            Apply
          </Button>
        </div>

        <Table>
          <TableBody>
            {summaryFields?.map((e, i) => (
              <TableRow key={i} className="[&:not(:nth-child(3))]:border-none">
                <TableCell className="font-medium">{e?.label}</TableCell>
                <TableCell className="text-right">{e?.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-start gap-2 text-sm">
          <Verified />
          <p>
            <span className="font-semibold">90 Day Limited Warranty</span>{" "}
            against manufacturer&apos;s defects{" "}
            <Link
              href={`/s/${storeId}/warranty`}
              className={cn(buttonVariants({ variant: "link" }))}
            >
              Details
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
function CartAddressButton() {
  const cart = useCart();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Order Address</CardTitle>

        <FormAlertDialogButton
          trigger={{
            variant: "outline",
            children: cart?.address ? "edit" : "add",
          }}
          title="Are you absolutely sure?"
          description="This action cannot be undone. This will permanently delete your account and remove your data from our servers."
          form={{
            validation: "cart-address-schema",
            onSubmit: async (data) => {
              console.log(data);

              cart.addCartAddress({ address: data });
              return { ok: true };
            },
            useForm: { defaultValues: { ...cart?.address } },
            className: "space-y-2",
          }}
        >
          <FormInputField field={{ name: "name" }} label="Full Name" />
          <FormInputField field={{ name: "phone" }} label="Phone" />
          <FormInputField
            field={{ name: "address_line" }}
            label="Address Line"
          />
          <FormInputField field={{ name: "zip" }} label="Zip" />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <FormInputField field={{ name: "state" }} label="State" />
            <FormInputField field={{ name: "city" }} label="City" />
            <FormInputField field={{ name: "country" }} label="Country" />
          </div>
        </FormAlertDialogButton>
      </CardHeader>

      <CardContent>
        <Table>
          <TableBody>
            {Object.entries(cart?.address ?? {})?.map(([key, value], i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{key}</TableCell>
                <TableCell className="text-right">{value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
function OrderPaymentMethod() {
  const cart = useCart();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form
          validation="cart-payment-schema"
          onSubmit={async () => {}}
          useForm={{
            defaultValues: {
              "payment-method": cart?.["payment-method"] ?? undefined,
            },
          }}
          className="space-y-2"
        >
          <FormSelectField
            field={{ name: "payment-method" }}
            label={{ className: "sr-only", children: "Payment Methods" }}
            placeholder="select a payment method..."
            // defaultValue={field.value}
            // onValueChange={(e) => {
            // 	field.onChange(e);
            // 	cart.addCartPayment({ "payment-method": e as any });
            // }}
            items={PAYMENT_METHODS}
            // defaultValue={PAYMENT_METHODS?.filter(e=> !e?.disabled)?.}
            onValueChange={(v) =>
              cart.addCartPayment({ "payment-method": v as any })
            }
          />
        </Form>
      </CardContent>
    </Card>
  );
}
