"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import * as z from "zod";
import { orderCreateSchema } from "@/validations/orders";
import { createOrder } from "@/servers/orders";
import { Icons } from "@/components/icons";
import { Product, Store } from "@prisma/client";
import { Dictionary } from "@/types/locale";
import { ProductAttribute } from "@/types/db";

export type OrderCreateButtonProps = {
	store: Pick<Store, "id">;
	products: (Product & { attributes: ProductAttribute[] })[];
} & Dictionary["order-create-button"];

export function OrderCreateButton({
	dic: { "order-create-button": c, ...dic },
	store,
	products,
}: OrderCreateButtonProps) {
	const [loading, setLoading] = useState<boolean>(false);

	async function onSubmit() {
		try {
			setLoading(true);
			const data = {
				storeId: store?.["id"],
				status: "PENDING",
				details: {
					products: products?.map((e, i) => ({
						productId: e?.["id"],
						price: e?.["price"],
						quantity: i + 1,
						attributes: e?.["attributes"]?.map((x) => ({
							name: x?.["name"],
							value: x?.["values"]?.["0"]?.["name"],
						})),
					})),
					address: {
						name: "Lamiaa Gebriel",
						phone: "01022184878",
						address_line: "03 building",
						zip: "18505",
						state: "Daraw",
						city: "Aswan",
						country: "Egypt",
					},
					paymentMethod: "cash",
				},
			} satisfies z.infer<typeof orderCreateSchema>;
			await orderCreateSchema.parse(data);
			const result = await createOrder(data);

			if (result && typeof result === "object" && "error" in result) {
				toast.error(result?.["error"]);
				return;
			}

			toast.success("created successfully.");
			// router.push(`/dashboard/o/${}`);
		} catch (err: any) {
			toast.error(err?.["message"]);
		} finally {
			setLoading(false);
		}
	}

	return (
		<Button onClick={onSubmit} disabled={loading}>
			{loading && <Icons.spinner />}
			{c?.["create order"]}
		</Button>
	);
}
