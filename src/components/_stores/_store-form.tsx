"use client";

import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { storeCreateSchema, storeUpdateSchema } from "@/validations/stores";
import { Input } from "@/components/ui/input";
import { Dictionary } from "@/types/locale";

export type StoreFormProps = {
	loading: boolean;
	form: UseFormReturn<
		z.infer<typeof storeCreateSchema> | z.infer<typeof storeUpdateSchema>,
		any,
		undefined
	>;
} & Dictionary["store-form"];

export const StoreForm = {
	name: ({
		dic: {
			"store-form": { name: c },
		},
		loading,
		form,
	}: StoreFormProps) => (
		<FormField
			control={form.control}
			name="name"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{c?.["name"]}</FormLabel>
					<FormControl>
						<Input placeholder={c?.["ovve.eg"]} disabled={loading} {...field} />
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
};
