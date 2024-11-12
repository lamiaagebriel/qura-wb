"use client";

import { Icons } from "@/components/icons";
import { Button, ButtonProps } from "@/components/ui/button";
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
import { productDeleteSchema } from "@/validations/products";
import { deleteProduct } from "@/servers/products";
import { Product } from "@prisma/client";

export type ProductDeleteButtonProps = {
	product: Pick<Product, "id">;
} & ButtonProps &
	Dictionary["product-delete-button"];

export function ProductDeleteButton({
	dic: { "product-delete-button": c, ...dic },
	product,
	...props
}: ProductDeleteButtonProps) {
	const router = useRouter();
	const [loading, setLoading] = useState<boolean>(false);
	const [open, setOpen] = useState<boolean>(false);

	const form = useForm<z.infer<typeof productDeleteSchema>>({
		resolver: zodResolver(productDeleteSchema),
		defaultValues: { id: product?.["id"] },
	});

	async function onSubmit(data: z.infer<typeof productDeleteSchema>) {
		try {
			setLoading(true);
			const result = await deleteProduct(data);

			if (result && typeof result === "object" && "error" in result) {
				toast.error(result?.["error"]);
				return;
			}

			toast.success(c?.["deleted successfully."]);
			router.refresh();
			setOpen(false);
		} catch (err: any) {
			toast.error(err?.["message"]);
		} finally {
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
				<Button {...props}>{c?.["delete"]}</Button>
			</AlertDialogTrigger>
			<AlertDialogContent className="max-h-[95svh] overflow-auto rounded-md">
				<AlertDialogHeader>
					<AlertDialogTitle className="justify-start">{c?.["delete product"]}</AlertDialogTitle>
					<AlertDialogDescription className="max-w-prose">
						{
							c?.[
								"delete a A well-structured product that helps highlight the unique features, target audience, market strategy, and performance metrics of your project."
							]
						}
					</AlertDialogDescription>
				</AlertDialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
						<AlertDialogFooter>
							<AlertDialogCancel disabled={loading} asChild>
								<Button disabled={loading} variant="outline">
									{c?.["cancel"]}
								</Button>
							</AlertDialogCancel>
							<Button
								type="submit"
								variant="destructive"
								disabled={loading}
								className="w-full md:w-fit"
							>
								{loading && <Icons.spinner />}
								{c?.["confirm"]}
							</Button>
						</AlertDialogFooter>
					</form>
				</Form>
			</AlertDialogContent>
		</AlertDialog>
	);
}
