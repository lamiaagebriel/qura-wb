"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import {
	AlertDialog,
	AlertDialogCancelCircle,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Icons } from "@/components/icons";
import { Button, ButtonProps } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Dictionary } from "@/types/locale";
import { Product } from "@prisma/client";
import { reviewCreateSchema } from "@/validations/reviews";
import { ReviewForm, ReviewFormProps } from "./_review-form";
import { createReview } from "@/servers/reviews";

type ReviewCreateButtonProps = {
	product: Pick<Product, "id">;
} & Dictionary["review-create-button"] &
	Pick<ReviewFormProps, "dic"> &
	ButtonProps;

export function ReviewCreateButton({
	dic: { "review-create-button": c, ...dic },
	product,
	...props
}: ReviewCreateButtonProps) {
	const [loading, setLoading] = useState<boolean>(false);
	const [open, setOpen] = useState<boolean>(false);

	const form = useForm<z.infer<typeof reviewCreateSchema>>({
		resolver: zodResolver(reviewCreateSchema),
		defaultValues: { productId: product?.["id"], rating: 0, content: "" },
	});

	async function onSubmit(data: z.infer<typeof reviewCreateSchema>) {
		try {
			setLoading(true);
			const result = await createReview(data);

			if (result && typeof result === "object" && "error" in result)
				throw new Error(result?.["error"]);

			toast.success(c?.["created successfully."]);
			form.reset();
			setOpen(false);
		} catch (err: any) {
			toast.error(err?.["message"]);
		} finally {
			setLoading(false);
		}
	}
	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button variant="outline" {...props}>
					<Icons.add />
					{c?.["create review"]}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent className="max-h-[95svh] overflow-auto rounded-md">
				<AlertDialogHeader>
					<AlertDialogTitle>{c?.["create review"]}</AlertDialogTitle>
					<AlertDialogDescription>
						{
							c?.[
								"create a A well-structured review that helps highlight the unique features, target audience, market strategy, and performance metrics of your project."
							]
						}
					</AlertDialogDescription>
				</AlertDialogHeader>

				{/* <AlertDialogCancelCircle /> */}

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<ReviewForm.rating dic={dic} form={form as any} loading={loading} />
						<ReviewForm.content dic={dic} form={form as any} loading={loading} />

						<AlertDialogFooter>
							<AlertDialogCancel disabled={loading}> {c?.["cancel"]}</AlertDialogCancel>
							<Button type="submit" className="w-full" disabled={loading}>
								{loading && <Icons.spinner />}
								{c?.["submit"]}
							</Button>

							{/* <AlertDialogAction>Continue</AlertDialogAction> */}
						</AlertDialogFooter>
					</form>
				</Form>
			</AlertDialogContent>
		</AlertDialog>
	);
}
