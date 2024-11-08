"use client";

import { useCart } from "@/lib/redux";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Verified } from "lucide-react";
import { Link } from "@/components/link";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useState } from "react";
import { CartAddressButton } from "./cart-address-button";
import { Icons } from "../icons";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cartPaymentSchema } from "@/lib/redux/validations";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { AlertDialogCancel, AlertDialogFooter } from "../ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { orderCreateSchema } from "@/validations/orders";
import { createOrder } from "@/servers/orders";
import { toast } from "sonner";
// const SUMMARY: { label: React.ReactNode; value: React.ReactNode }[] = [
// 	{
// 		label: "Subtotal",
// 		value: (
// 			<GetPrice
// 				price={cart.actual_cost}
// 				discount={(1 - cart.cost / cart.actual_cost) * 100}
// 				className="text-foreground"
// 			/>
// 		),
// 	},
// 	{
// 		label: "Saved",
// 		value: cart.actual_cost - cart.cost <= 0 ? "---" : getCurrency(cart.actual_cost - cart.cost),
// 	},
// 	{
// 		label: "Items",
// 		value: cart.total_items,
// 	},
// 	{
// 		label: "Payment Method",
// 		value: "Cash",
// 	},
// 	{
// 		label: "Shipping",
// 		value: getCurrency(SHIPPING_COST),
// 	},
// 	{
// 		label: "Total",
// 		value: (
// 			<>
// 				<p>{getCurrency(cart.cost + SHIPPING_COST)} USD</p>
// 				<p className="text-[9px] text-muted-foreground/90">including VAT</p>
// 			</>
// 		),
// 	},
// ];
const SHIPPING_COST = 10;

type CartOrderStepsProps = {};
export function CartOrderSteps({}: CartOrderStepsProps) {
	const cart = useCart();
	const [loading, setLoading] = useState<boolean>(false);
	const [crrStage, setCrrStage] = useState<number>(0);
	const stages = [
		{ value: "summary", label: "Order Summary", content: <OrderSummary /> },
		{ value: "address", label: "Order Address", content: <CartAddressButton /> },
		{ value: "payment-method", label: "Payment Method", content: <OrderPaymentMethod /> },
	];

	async function onCheckout() {
		try {
			setLoading(true);
			const data = {
				storeId: cart?.["products"]?.["0"]?.["product"]?.["storeId"],
				status: "PENDING",
				details: {
					products: cart?.["products"]?.map((e) => ({
						productId: e?.["product"]?.["id"],
						price: e?.["product"]?.["price"],
						quantity: e?.["quantity"],
						attributes: e?.["attributes"],
					})),
					address: cart?.["address"]!,
					paymentMethod: cart?.["payment-method"] ?? "cash",
				},
			} satisfies z.infer<typeof orderCreateSchema>;
			await orderCreateSchema.parse(data);
			const result = await createOrder(data);

			if (result && typeof result === "object" && "error" in result) {
				toast.error(result?.["error"]);
				return;
			}

			toast.success("created successfully.");
			cart.clear();
			// router.push(`/dashboard/o/${}`);
		} catch (err: any) {
			toast.error(err?.["message"]);
		} finally {
			setLoading(false);
		}
	}

	const isLast = crrStage === stages?.["length"] - 1;
	return (
		<Tabs value={stages?.[crrStage]?.["value"]}>
			<TabsList className="w-full">
				{stages?.map((e, i) => (
					<TabsTrigger key={i} disabled={i > crrStage} value={e?.["value"]} className="w-full">
						{e?.["label"]}
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
							(crrStage === 1 && !cart?.["address"]) ||
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
				<TabsContent key={i} value={e?.["value"]}>
					{e?.["content"]}

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
	);
}

function OrderSummary() {
	const cart = useCart();
	const subtotal = cart?.["products"]
		?.reduce((acc, crr) => acc + crr?.["product"]?.["price"] * crr?.["quantity"], 0)
		.toFixed(2);

	const summaryFields = [
		{
			label: "Subtotal",
			value: <>{subtotal} USD</>,
		},
		{ label: "Discount (10%)", value: <>-1.50 USD</> },
		{ label: "Delivery Fee", value: <>10.00 USD</> },
		{ label: "Total", value: <>{(Number.parseFloat(subtotal) + 10.0 - 1.5).toFixed(2)} USD</> },
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Order Summary</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="flex items-center gap-2">
					<Input placeholder="Discount Voucher" className="w-full rounded-full" />
					<Button variant="outline" className="rounded-full">
						Apply
					</Button>
				</div>

				<Table>
					<TableBody>
						{summaryFields?.map((e, i) => (
							<TableRow key={i} className="[&:not(:nth-child(3))]:border-none">
								<TableCell className="font-medium">{e?.["label"]}</TableCell>
								<TableCell className="text-right">{e?.["value"]}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>

				{/* <div className="flex items-start gap-2">
    <Verified />
    <p>
      <span className="font-semibold">90 Day Limited Warranty</span> against
      manufacturer&apos;s defects <Link href={`/s/${storeId}/warranty`}>Details</Link>
    </p>
  </div> */}
			</CardContent>
		</Card>
	);
}

function OrderPaymentMethod() {
	const cart = useCart();

	const PAYMENT_METHODS: any[] = [
		{
			value: "cash",
			label: "Cash",
			disabled: true,
		},
		{
			value: "paypal",
			label: "Paypal",
			disabled: false,
		},
	];
	const form = useForm<z.infer<typeof cartPaymentSchema>>({
		resolver: zodResolver(cartPaymentSchema),
		defaultValues: { "payment-method": cart?.["payment-method"] ?? undefined },
	});
	async function onSubmit(data: z.infer<typeof cartPaymentSchema>) {}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Payment Methods</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
						<FormField
							control={form.control}
							name="payment-method"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="sr-only">Payment Methods</FormLabel>
									<Select
										defaultValue={field.value}
										onValueChange={(e) => {
											field.onChange(e);
											cart.addCartPayment({ "payment-method": e as any });
										}}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder={"select a payment method..."} />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{PAYMENT_METHODS?.map((e, i) => (
												<SelectItem key={i} value={e?.["value"]} disabled={e?.["disabled"]}>
													{e?.["label"]}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
