"use client";

import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { productCreateSchema, productUpdateSchema } from "@/validations/products";
import { Dictionary } from "@/types/locale";
import { fileToBase64 } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { PRODUCT_STATUS_ARR, productStatus } from "@/constants/enums";
import { useLocale } from "@/hooks/use-locale";

export type ProductFormProps = {
	loading: boolean;
	form: UseFormReturn<
		z.infer<typeof productCreateSchema> | z.infer<typeof productUpdateSchema>,
		any,
		undefined
	>;
} & Dictionary["product-form"];

export const ProductForm = {
	name: ({
		dic: {
			"product-form": { name: c },
		},
		loading,
		form,
	}: ProductFormProps) => (
		<FormField
			control={form.control}
			name="name"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{c?.["name"]}</FormLabel>
					<FormControl>
						<Input placeholder={c?.["blue jacket"]} disabled={loading} {...field} />
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
	status: function Component({
		// dic: {
		// 	"product-form": { name: c },
		// },
		loading,
		form,
	}: ProductFormProps) {
		const locale = useLocale();

		return (
			<FormField
				control={form?.["control"]}
				name="status"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Status</FormLabel>
						<Select defaultValue={field?.["value"]} onValueChange={field?.onChange}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="select status..." />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{productStatus({ locale }).map((e, i) => (
									<SelectItem key={i} value={e?.["value"]}>
										{e?.["label"]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	},
	images: ({
		// dic: {
		// 	"product-form": { image: c },
		// },
		loading,
		form,
	}: ProductFormProps) => (
		<FormField
			control={form?.["control"]}
			name={`images.${0}`}
			render={({ field }) => (
				<FormItem>
					<FormControl>
						<Input
							// {...field}
							type="file"
							accept="image/*"
							multiple={true}
							disabled={loading}
							value={undefined}
							onChange={async (e) => {
								const files = e.target.files;
								const base64Files: string[] = [];

								for (let i = 0; i < (files?.["length"] as number); i++) {
									const file = files?.[i];
									if (file) {
										const base64 = (await fileToBase64({ file }))?.toString();
										base64Files.push(base64 ?? "");
									}
								}

								form.setValue("images", base64Files);
							}}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
};
