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
import { orderDeleteSchema } from "@/validations/orders";
import { deleteOrder } from "@/servers/orders";
import { Order } from "@prisma/client";

export type OrderDeleteButtonProps = {
	order: Pick<Order, "id">;
} & ButtonProps &
	Dictionary["order-delete-button"];

export function OrderDeleteButton({
	dic: { "order-delete-button": c, ...dic },
	order,
	...props
}: OrderDeleteButtonProps) {
	const router = useRouter();
	const [loading, setLoading] = useState<boolean>(false);
	const [open, setOpen] = useState<boolean>(false);

	const form = useForm<z.infer<typeof orderDeleteSchema>>({
		resolver: zodResolver(orderDeleteSchema),
		defaultValues: { id: order?.["id"] },
	});

	async function onSubmit(data: z.infer<typeof orderDeleteSchema>) {
		try {
			setLoading(true);
			const result = await deleteOrder(data);

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
					<AlertDialogTitle className="justify-start">{c?.["delete order"]}</AlertDialogTitle>
					<AlertDialogDescription className="max-w-prose">
						{
							c?.[
								"delete a A well-structured order that helps highlight the unique features, target audience, market strategy, and performance metrics of your project."
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
