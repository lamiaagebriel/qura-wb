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
import { StoreForm, StoreFormProps } from "@/components/_stores/_store-form";
import { storeUpdateSchema } from "@/validations/stores";
import { updateStore } from "@/servers/stores";
import { Store } from "@prisma/client";

export type StoreUpdateButtonProps = {
	store: Pick<Store, "id">;
} & ButtonProps &
	Dictionary["store-update-button"] &
	Pick<StoreFormProps, "dic">;
export function StoreUpdateButton({
	dic: { "store-update-button": c, ...dic },
	store,
	...props
}: StoreUpdateButtonProps) {
	const router = useRouter();
	const [loading, setLoading] = useState<boolean>(false);
	const [open, setOpen] = useState<boolean>(false);

	const form = useForm<z.infer<typeof storeUpdateSchema>>({
		resolver: zodResolver(storeUpdateSchema),
		defaultValues: { ...store },
	});

	async function onSubmit(data: z.infer<typeof storeUpdateSchema>) {
		try {
			setLoading(true);
			const result = await updateStore(data);

			if (result && typeof result === "object" && "error" in result) {
				toast.error(result?.["error"]);
				return;
			}

			toast.success(c?.["updated successfully."]);
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
				<Button {...props}>{c?.["edit"]}</Button>
			</AlertDialogTrigger>
			<AlertDialogContent className="max-h-[95svh] overflow-auto rounded-md">
				<AlertDialogHeader>
					<AlertDialogTitle className="justify-start">{c?.["update store"]}</AlertDialogTitle>
					<AlertDialogDescription className="max-w-prose">
						{
							c?.[
								"update a A well-structured store that helps highlight the unique features, target audience, market strategy, and performance metrics of your project."
							]
						}
					</AlertDialogDescription>
				</AlertDialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
						<StoreForm.name dic={dic} form={form as any} loading={loading} />

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
