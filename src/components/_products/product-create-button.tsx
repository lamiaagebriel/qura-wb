"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Dictionary } from "@/types/locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { productCreateSchema } from "@/validations/products";
import { createProduct } from "@/servers/products";
import { Store } from "@prisma/client";

export type ProductCreateButtonProps = {
	store: Pick<Store, "id">;
} & Dictionary["product-create-button"];

export function ProductCreateButton({
	dic: { "product-create-button": c, ...dic },
	store,
}: ProductCreateButtonProps) {
	const router = useRouter();
	const [loading, setLoading] = useState<boolean>(false);
	const [open, setOpen] = useState<boolean>(false);

	const form = useForm<z.infer<typeof productCreateSchema>>({
		resolver: zodResolver(productCreateSchema),
		defaultValues: { storeId: store?.["id"] },
	});

	async function onSubmit(data: z.infer<typeof productCreateSchema>) {
		try {
			setLoading(true);
			const result = await createProduct(data);

			if (result && typeof result === "object" && "error" in result) {
				toast.error(result?.["error"]);
				return;
			}

			toast.success(c?.["created successfully."]);
			router.push(`/ss/${store?.["id"]}/products/${result?.["id"]}`);
		} catch (err: any) {
			toast.error(err?.["message"]);
			setLoading(false);
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
				<Button type="submit" disabled={loading}>
					{loading && <Icons.spinner />}
					{c?.["create product"]}
				</Button>
			</form>
		</Form>
	);
}
