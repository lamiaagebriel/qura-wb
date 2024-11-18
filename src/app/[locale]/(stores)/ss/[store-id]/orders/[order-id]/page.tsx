import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";
import { Breadcrumbs } from "@/components/ss/breadcrumbs";
import { getDictionary } from "@/lib/locale";
import { db } from "@/lib/prisma";
import { getAuth } from "@/lib/lucia";
import { z } from "zod";
import { orderCreateSchema, orderSchema } from "@/validations/orders";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { OrderDeleteButton } from "@/components/_orders/order-delete-button";
import { LocaleLink } from "@/components/links";
import { cn } from "@/lib/shadcn";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { orderStatus } from "@/constants/enums";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Image } from "@/components/image";
import { Product } from "@prisma/client";
import { ProductAttribute } from "@/types/db";
import { Calendar } from "lucide-react";

type OrderProps = Readonly<{
	params: Promise<{ "store-id": string; "order-id": string } & LocaleProps>;
}>;
export const metadata: Metadata = { title: "Order" };
export default async function Order({ params }: OrderProps) {
	const { locale, "store-id": storeId, "order-id": orderId } = await params;
	const user = (await getAuth())?.["user"]!;
	const dic = await getDictionary({ locale });
	const c = dic?.["order-editor"];

	// const r = await db.order.findUnique({
	// 	where: {
	// 		id: orderId,
	// 		storeId,
	// 	},
	// });
	// if (!r) return <div className="container">NO ORDER</div>;
	// const order = { ...r } as unknown as z.infer<typeof orderSchema>;
	const products = (await db.product.findMany()) as unknown as (Product & {
		attributes: ProductAttribute[];
	})[];
	const userOrder = await db.order.findMany({
		select: { status: true },
		where: { userId: user?.["id"] },
	});

	const order = {
		id: "1",
		status: "PENDING",
		createsAt: new Date(),
		storeId: products?.["0"]?.["storeId"],
		products: products?.map((e) => ({
			productId: e?.["id"],
			name: e?.["name"],
			images: e?.["images"],
			attributes: e?.["attributes"],
			price: e?.["price"],
		})),
		customer: {
			...user,
			preview: {
				pending: userOrder?.filter((o) => o?.["status"] === "PENDING")?.["length"],
				confirmed: userOrder?.filter((o) => o?.["status"] === "CONFIRMED")?.["length"],
				declined: userOrder?.filter((o) => o?.["status"] === "DECLINED")?.["length"],
				Delivering: userOrder?.filter((o) => o?.["status"] === "DELIVERYING")?.["length"],
				Delivered: userOrder?.filter((o) => o?.["status"] === "DELIVERYED")?.["length"],
				Cancelled: userOrder?.filter((o) => o?.["status"] === "CANCELLED")?.["length"],
			},
		},
		address: {
			name: "Lamiaa Gebriel",
			phone: "+201022184878",
			addressLine: "808 building",
			zip: "18525",
			state: "Daraw",
			city: "Aswan",
			country: "Egypt",
		},
		summary: {
			subtotal: "$1,500.00",
			discount: "$100.00",
			shipping: "$60.00",

			total: "$1,499.00",
		},
		timelines: [
			{
				id: 1,
				user,
				status: "Order Placed",
				description: "Your order has been placed successfully.",
				timestamp: "2024-11-10 10:30 AM",
			},
			{
				id: 2,
				user,
				status: "Payment Confirmed",
				description: "Payment has been confirmed.",
				timestamp: "2024-11-10 11:00 AM",
			},
			{
				id: 3,
				user,
				status: "Processing",
				description: "Your order is being prepared.",
				timestamp: "2024-11-10 01:30 PM",
			},
			{
				id: 4,
				user,
				status: "Shipped",
				description: "Your order has been shipped.",
				timestamp: "2024-11-11 09:00 AM",
			},
			{
				id: 5,
				user,
				status: "Delivered",
				description: "Order has been delivered to the address.",
				timestamp: "2024-11-12 03:00 PM",
			},
		],
	};
	return (
		<div>
			<Breadcrumbs
				items={[
					{ segments: [], value: `/ss/${storeId}/orders`, label: "Orders" },
					{ segments: [], value: ``, label: `${c?.["order"]} #${order?.["id"]}` },
				]}
			/>

			<div className="container max-w-screen-lg py-4">
				<main className="flex flex-col gap-4">
					<div className="space-y-1">
						<div className="flex items-center justify-between gap-4">
							<div className="flex items-center gap-2">
								<LocaleLink
									href={`/ss/${storeId}/orders`}
									className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 w-7")}
								>
									<Icons.arrowLeft className="rtl:rotate-180" />
									<span className="sr-only">{c?.["back"]}</span>
								</LocaleLink>

								<h1 className="flex-1 text-xl font-semibold tracking-tight">
									{c?.["order details"]}
								</h1>
								<Badge variant="outline">
									{
										orderStatus({ locale })?.find((e) => e?.["value"] === order?.["status"])?.[
											"label"
										]
									}
								</Badge>
							</div>

							<div className="hidden items-center gap-2 md:flex">
								{/* <OrderDeleteButton dic={dic} order={order} variant="destructive" size="sm" /> */}

								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										// onClick={() => form.reset()}
									>
										{c?.["discard"]}
									</Button>
									<Button type="submit" size="sm">
										{/* {loading && <Icons.spinner />} */}
										{c?.["save changes"]}
									</Button>
								</div>
							</div>
						</div>

						<p className="text-xs text-muted-foreground">
							{new Date(order?.["createsAt"])?.toString()}
						</p>
					</div>

					<div
						// onSubmit={form.handleSubmit(onSubmit)}
						className="grid gap-2 md:grid-cols-[1fr,250px] lg:grid-cols-3 lg:gap-4"
					>
						<div className="grid auto-rows-max items-start gap-2 lg:col-span-2 lg:gap-4">
							<Card>
								<CardContent>
									<div className="grid gap-2">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="text-start">{c?.["order details"]}</TableHead>
													<TableHead>{c?.["quantity"]}</TableHead>
													<TableHead>{c?.["total"]}</TableHead>
													<TableHead className="sr-only">{c?.["actions"]}</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{order?.["products"]?.map((e, i) => (
													<TableRow key={i}>
														<TableCell>
															<LocaleLink
																href={`/s/${order?.["storeId"]}/p/${e?.["productId"]}`}
																className="flex w-full items-center"
															>
																<div className="flex items-center justify-start gap-2">
																	<Image
																		src={e?.["images"]?.[0]!}
																		alt=""
																		className="aspect-square size-10"
																	/>
																	<div className="flex-1">
																		<CardTitle>{e?.["name"]}</CardTitle>
																		<CardDescription>
																			{e?.["attributes"]
																				?.map((e) =>
																					[e?.["name"], e?.["values"]?.[0]?.["name"]]?.join(": "),
																				)
																				?.join(", ")}
																		</CardDescription>
																	</div>
																</div>
															</LocaleLink>
														</TableCell>
														<TableCell>
															3 <span className="text-xs text-muted-foreground"> x</span>{" "}
															{e?.["price"]}$
														</TableCell>
														<TableCell>{3 * e?.["price"]}$</TableCell>
														<TableCell>
															<div className="flex items-center justify-center gap-2">
																<Button variant="outline" size="icon" className="size-6">
																	<Icons.edit className="size-3" />
																</Button>
																<Button variant="destructive" size="icon" className="size-6">
																	<Icons.trash className="size-3" />
																</Button>
															</div>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex-row items-center justify-between">
									<div>
										<CardTitle className="text-sm font-medium uppercase text-muted-foreground">
											{c?.["summary"]}
										</CardTitle>
									</div>
									<div>
										<Button variant="outline" size="icon" className="size-6">
											<Icons.edit className="size-3" />
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									<Table>
										<TableBody>
											{Object.entries(order?.["summary"])?.map(([key, value], i) => (
												<TableRow key={i}>
													<TableCell className="px-0 text-start font-medium">{key}</TableCell>
													<TableCell className="px-0 text-end">{value}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex flex-row items-center justify-between">
									<div>
										<CardTitle className="text-sm font-medium uppercase text-muted-foreground">
											{c?.["timeline"]}
										</CardTitle>
									</div>
									<div>
										<Button variant="secondary" size="sm">
											{c?.["change status"]}
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									<div className="relative">
										<div className="absolute left-4 top-0 h-full w-0.5 bg-muted rtl:right-4" />

										<div className="space-y-3">
											{order?.["timelines"]?.map((e, i) => (
												<div key={i} className="relative flex items-start gap-2">
													<div className="flex flex-shrink-0">
														<Avatar className="size-9 rounded-full border-4 border-primary">
															<AvatarImage src={e?.["user"]?.["image"]!} alt="" />
															<AvatarFallback text={e?.["user"]?.["name"]}>
																<Icons.user className="size-3" />
															</AvatarFallback>
														</Avatar>
													</div>

													<Card className="w-full">
														<CardHeader>
															<div className="flex items-center justify-start gap-2">
																<Calendar className="size-4 text-muted-foreground" />
																<h3 className="font-semibold">{e.status}</h3>
															</div>

															<p className="text-xs text-muted-foreground">{e.timestamp}</p>
														</CardHeader>
														<CardContent>
															<p className="text-sm text-muted-foreground">{e.description}</p>
														</CardContent>
													</Card>
												</div>
											))}
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
						<div className="grid auto-rows-max items-start gap-2 lg:gap-4">
							<Card>
								<CardHeader>
									<CardTitle className="text-sm font-medium uppercase text-muted-foreground">
										{c?.["customer details"]}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid gap-2">
										<div className="flex items-center gap-2">
											<Avatar>
												<AvatarImage src={order?.["customer"]?.["image"]!} alt="" />
												<AvatarFallback text={order?.["customer"]?.["name"]} />
											</Avatar>
											<div>
												<h2>{order?.["customer"]?.["name"]}</h2>
												<p className="text-xs text-muted-foreground">
													{order?.["customer"]?.["email"]}
												</p>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className="text-sm font-medium uppercase text-muted-foreground">
										{c?.["customer preview"]}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<Table>
										<TableBody>
											{Object.entries(order?.["customer"]?.["preview"])?.map(([key, value], i) => (
												<TableRow key={i}>
													<TableCell className="px-0 text-start font-medium">{key}</TableCell>
													<TableCell className="px-0 text-end">{value}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex-row items-center justify-between">
									<div>
										<CardTitle className="text-sm font-medium uppercase text-muted-foreground">
											{c?.["shipping address"]}
										</CardTitle>
									</div>
									<div>
										<Button variant="outline" size="icon" className="size-6">
											<Icons.edit className="size-3" />
										</Button>
									</div>
								</CardHeader>

								<CardContent>
									<Table>
										<TableBody>
											{Object.entries(order?.["address"])?.map(([key, value], i) => (
												<TableRow key={i}>
													<TableCell className="px-0 text-start font-medium">{key}</TableCell>
													<TableCell className="px-0 text-end">{value}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</CardContent>
							</Card>
						</div>
					</div>

					<div className="flex items-center justify-center gap-2 md:hidden">
						{/* <OrderDeleteButton dic={dic} order={order} variant="destructive" size="sm" /> */}
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								// onClick={() => form.reset()}
							>
								{c?.["discard"]}
							</Button>
							<Button type="submit" size="sm">
								{/* {loading && <Icons.spinner />} */}
								{c?.["save changes"]}
							</Button>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
