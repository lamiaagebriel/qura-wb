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
import { Textarea } from "../ui/textarea";

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
						<Input {...field} disabled={loading} placeholder={c?.["blue jacket"]} />
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
	description: ({
		dic: {
			"product-form": { description: c },
		},
		loading,
		form,
	}: ProductFormProps) => (
		<FormField
			control={form.control}
			name="description"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{c?.["description"]}</FormLabel>
					<FormControl>
						<Textarea
							{...field}
							disabled={loading}
							placeholder={c?.["describe the product..."]}
							value={field?.["value"] ?? undefined}
							className="min-h-40"
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
	status: function Component({
		dic: {
			"product-form": { status: c },
		},
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
						<FormLabel>{c?.["status"]}</FormLabel>
						<Select
							disabled={loading}
							defaultValue={field?.["value"]}
							onValueChange={field?.onChange}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder={c?.["select status..."]} />
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
	price: ({
		dic: {
			"product-form": { price: c },
		},
		loading,
		form,
	}: ProductFormProps) => (
		<FormField
			control={form.control}
			name="price"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{c?.["price"]}</FormLabel>
					<FormControl>
						<Input
							{...field}
							type="number"
							disabled={loading}
							placeholder={`20`}
							onChange={(e) => {
								const evt = {
									...e,
									target: { ...e?.["target"], value: Number(e?.["target"]?.["value"]) },
								};

								field?.onChange(evt);
							}}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
	stock: ({
		dic: {
			"product-form": { stock: c },
		},
		loading,
		form,
	}: ProductFormProps) => (
		<FormField
			control={form.control}
			name="stock"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{c?.["stock"]}</FormLabel>
					<FormControl>
						<Input
							{...field}
							type="number"
							disabled={loading}
							placeholder={`20`}
							onChange={(e) => {
								const evt = {
									...e,
									target: { ...e?.["target"], value: Number(e?.["target"]?.["value"]) },
								};

								field?.onChange(evt);
							}}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
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
							disabled={loading}
							type="file"
							accept="image/*"
							multiple={true}
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
