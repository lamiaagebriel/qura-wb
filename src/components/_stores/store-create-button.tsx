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
import { StoreForm, StoreFormProps } from "@/components/_stores/_store-form";
import { storeCreateSchema } from "@/validations/stores";
import { createStore } from "@/servers/stores";

export type StoreCreateButtonProps = {} & Dictionary["store-create-button"] &
	Pick<StoreFormProps, "dic">;
export function StoreCreateButton({
	dic: { "store-create-button": c, ...dic },
}: StoreCreateButtonProps) {
	const router = useRouter();
	const [loading, setLoading] = useState<boolean>(false);
	const [open, setOpen] = useState<boolean>(false);

	const form = useForm<z.infer<typeof storeCreateSchema>>({
		resolver: zodResolver(storeCreateSchema),
	});

	async function onSubmit(data: z.infer<typeof storeCreateSchema>) {
		try {
			setLoading(true);
			const result = await createStore(data);

			if (result && typeof result === "object" && "error" in result) {
				toast.error(result?.["error"]);
				return;
			}

			toast.success(c?.["created successfully."]);
			router.push(`/dashboard/s/${result?.["id"]}`);
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
				<Button>{c?.["create store"]}</Button>
			</AlertDialogTrigger>
			<AlertDialogContent className="max-h-[95svh] overflow-auto rounded-md">
				<AlertDialogHeader>
					<AlertDialogTitle className="justify-start">{c?.["create store"]}</AlertDialogTitle>
					<AlertDialogDescription className="max-w-prose">
						{
							c?.[
								"create a A well-structured store that helps highlight the unique features, target audience, market strategy, and performance metrics of your project."
							]
						}
					</AlertDialogDescription>
				</AlertDialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
						<div className="flex items-center justify-center">
							<StoreForm.logo dic={dic} form={form} loading={loading} />
						</div>
						<StoreForm.name dic={dic} form={form} loading={loading} />
						<RecursiveSelect
							options={{
								Technology: {
									Software: null,
									Hardware: null,
									"AI & Machine Learning": null,
								},
								Health: {
									"Mental Health": null,
									"Physical Health": null,
									Nutrition: null,
								},
								Finance: {
									"Personal Finance": null,
									"Corporate Finance": null,
									"Investing & Trading": null,
								},
							}}
							label="Select Category"
							form={form}
							loading={loading}
						/>

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

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function RecursiveSelect({
	options,
	label,
	form,
	loading,
}: {
	options: any;
	label: string;
	form: any;
	loading: any;
}) {
	const [selectedValue, setSelectedValue] = useState<string | null>(null);

	const handleSelect = (value: string) => {
		setSelectedValue(value);
		form.setValue("category", value);
	};

	return (
		<div>
			<Select onValueChange={handleSelect} disabled={loading}>
				<SelectTrigger>
					<SelectValue placeholder={label} />
				</SelectTrigger>
				<SelectContent>
					{Object.keys(options).map((option, i) => (
						<SelectItem key={i} value={option}>
							{option}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{selectedValue && options[selectedValue] && (
				<div className="ml-4 mt-2">
					<RecursiveSelect
						options={options[selectedValue]}
						label={`Choose ${selectedValue}`}
						form={form}
						loading={loading}
					/>
				</div>
			)}
		</div>
	);
}
