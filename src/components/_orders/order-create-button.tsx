"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import * as z from "zod";
// import { OrderForm, OrderFormProps } from "@/components/_orders/_order-form";
import { orderCreateSchema } from "@/validations/orders";
import { createOrder } from "@/servers/orders";
import { Icons } from "../icons";
import { useCart } from "@/lib/redux";
import { Store } from "@prisma/client";

export type OrderCreateButtonProps = { store: Pick<Store, "id"> };
// & Dictionary["order-create-button"];
// & Pick<OrderFormProps, "dic">;

export function OrderCreateButton({
	// dic: { "order-create-button": c, ...dic },
	store,
}: OrderCreateButtonProps) {
	const cart = useCart();
	const router = useRouter();
	const [loading, setLoading] = useState<boolean>(false);

	async function onSubmit() {
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
			Submit
		</Button>
	);
}
