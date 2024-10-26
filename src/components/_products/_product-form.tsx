"use client";

import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { productCreateSchema, productUpdateSchema } from "@/validations/products";
import { Input } from "@/components/ui/input";
import { Dictionary } from "@/types/locale";

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
};
