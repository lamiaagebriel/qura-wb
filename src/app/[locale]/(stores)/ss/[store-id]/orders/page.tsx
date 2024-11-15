import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";
import { Breadcrumbs } from "@/components/ss/breadcrumbs";
import { OrdersTable } from "@/components/_orders/orders-table";
import { getDictionary } from "@/lib/locale";
import { OrderCreateButton } from "@/components/_orders/order-create-button";
import { Icons } from "@/components/icons";
import { db } from "@/lib/prisma";
import { Product } from "@prisma/client";
import { ProductAttribute } from "@/types/db";
import { getAuth } from "@/lib/lucia";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type OrdersProps = Readonly<{
	params: Promise<{ "store-id": string } & LocaleProps>;
}>;
export const metadata: Metadata = { title: "Orders" };
export default async function Orders({ params }: OrdersProps) {
	const { locale, "store-id": storeId } = await params;
	const user = (await getAuth())?.["user"]!;
	const dic = await getDictionary({ locale });
	const c = dic?.["ss"]?.["store"]?.["orders"];
	const orders = await db.order.findMany({ where: { storeId } });

	const products = (await db.product.findMany({ where: { storeId } })) as unknown as (Product & {
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

	const tabs = [
		{
			value: "all",
			label: c?.["tabs"]?.["all"],
			products: products,
		},
		{
			value: "ACTIVE",
			label: c?.["tabs"]?.["active"],
			products: products?.filter((e) => e?.["status"] == "ACTIVE"),
		},
		{
			value: "DRAFT",
			label: c?.["tabs"]?.["draft"],
			products: products?.filter((e) => e?.["status"] == "DRAFT"),
		},
		{
			value: "ARCHIVE",
			label: c?.["tabs"]?.["archive"],
			products: products?.filter((e) => e?.["status"] == "ARCHIVE"),
		},
	];
	return (
		<div>
			<Breadcrumbs items={[{ segments: [], value: "", label: c?.["orders"] }]} />
			<div className="container flex items-center justify-between gap-2">
				<div>
					<h1 className="flex items-center gap-2 text-2xl font-semibold">
						<Icons.packagePlus className="size-5" />
						{c?.["orders"]}
					</h1>
					<p className="max-w-prose text-sm text-muted-foreground">
						{c?.["browse all orders, edit, and filter."]}
					</p>
				</div>
				<div>
					<OrderCreateButton dic={dic} store={{ id: storeId }} products={products} />
				</div>
			</div>

			<div className="container py-4">
				<Tabs defaultValue="all">
					<TabsList className="mb-4 h-fit justify-start rounded-none border-b bg-transparent p-0 rtl:flex-row-reverse">
						{tabs?.map((e, i) => (
							<TabsTrigger
								key={i}
								value={e?.["value"]}
								className="w-fit rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
							>
								{e?.["label"]} {e?.["products"]?.["length"]}
							</TabsTrigger>
						))}
					</TabsList>

					{tabs?.map((e, i) => (
						<TabsContent key={i} value={e?.["value"]}>
							<OrdersTable dic={dic} data={orders} order={order} />
						</TabsContent>
					))}
				</Tabs>
			</div>
		</div>
	);
}
