import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";
import { Breadcrumbs } from "@/components/ss/breadcrumbs";
import { OrdersTable } from "@/components/_orders/orders-table";
import { getDictionary } from "@/lib/locale";
import { OrderCreateButton } from "@/components/_orders/order-create-button";
import { Icons } from "@/components/icons";
import { db } from "@/lib/prisma";

type OrdersProps = Readonly<{
	params: Promise<{ "store-id": string } & LocaleProps>;
}>;
export const metadata: Metadata = { title: "Orders" };
export default async function Orders({ params }: OrdersProps) {
	const { locale, "store-id": storeId } = await params;
	const dic = await getDictionary({ locale });
	const orders = await db.order.findMany({ where: { storeId } });
	const products = await db.product.findMany({ where: { storeId } });

	return (
		<div>
			<Breadcrumbs items={[{ segments: [], value: "", label: "Orders" }]} />
			<div className="container flex items-center justify-between gap-2">
				<div>
					<h1 className="flex items-center gap-2 text-2xl font-semibold">
						<Icons.shirt className="size-5" />
						All Orders
					</h1>
					<p className="max-w-prose text-sm text-muted-foreground">
						Lorem ipsum dolor sit amet, consectetur adipisicing elit.
					</p>
				</div>
				<div>
					<OrderCreateButton dic={dic} store={{ id: storeId }} products={products as any} />
				</div>
			</div>

			<div className="container py-4">
				<OrdersTable dic={dic} data={orders} />
			</div>
		</div>
	);
}
