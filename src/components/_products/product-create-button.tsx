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
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProductForm, ProductFormProps } from "@/components/_products/_product-form";
import { productCreateSchema } from "@/validations/products";
import { createProduct } from "@/servers/products";
import { Store } from "@prisma/client";

export type ProductCreateButtonProps = {
	store: Pick<Store, "id">;
} & Dictionary["product-create-button"] &
	Pick<ProductFormProps, "dic">;
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
			router.push(`/dashboard/s/${store?.["id"]}/p/${result?.["id"]}`);
		} catch (err: any) {
			toast.error(err?.["message"]);
			setLoading(false);
		}
	}

	return (
		<AlertDialog
			open={open}
			onOpenChange={(o) => {
				form.reset();
				setOpen(o);
			}}
		>
			<AlertDialogTrigger asChild>
				<Button>{c?.["create product"]}</Button>
			</AlertDialogTrigger>
			<AlertDialogContent className="max-h-[95svh] overflow-auto rounded-md">
				<AlertDialogHeader>
					<AlertDialogTitle className="justify-start">{c?.["create product"]}</AlertDialogTitle>
					<AlertDialogDescription className="max-w-prose">
						{
							c?.[
								"create a A well-structured product that helps highlight the unique features, target audience, market strategy, and performance metrics of your project."
							]
						}
					</AlertDialogDescription>
				</AlertDialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
						<ProductForm.name dic={dic} form={form as any} loading={loading} />
						<ProductForm.images dic={dic} form={form as any} loading={loading} />

						<AlertDialogFooter>
							<AlertDialogCancel disabled={loading} asChild>
								<Button disabled={loading} variant="outline">
									{c?.["cancel"]}
								</Button>
							</AlertDialogCancel>
							<Button type="submit" disabled={loading} className="w-full md:w-fit">
								{loading && <Icons.spinner />}
								{c?.["submit"]}
							</Button>
						</AlertDialogFooter>
					</form>
				</Form>
			</AlertDialogContent>
		</AlertDialog>
	);
}
