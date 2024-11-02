"use client";

import { useFieldArray, UseFormReturn } from "react-hook-form";
import * as z from "zod";

import Image from "next/image";
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
import { Textarea } from "@/components/ui/textarea";
import { Icons } from "@/components/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Button } from "@/components/ui/button";
import { useState } from "react";
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
	images: function Component({
		// dic: {
		// 	"product-form": { image: c },
		// },
		loading,
		form,
	}: ProductFormProps) {
		const imagesForm = useFieldArray({
			// @ts-expect-error
			name: "images",
			control: form?.["control"],
		});

		return (
			<div className="grid gap-2">
				<div className="relative">
					<Image
						alt="Product image"
						className="aspect-square w-full rounded-md object-cover object-center"
						height="300"
						src={form.watch("images")?.[0] ?? "https://ui.shadcn.com/placeholder.svg"}
						width="300"
					/>
					{form.watch("images")?.[0] ? (
						<Button
							variant="destructive"
							size="icon"
							onClick={() =>
								form.setValue(
									"images",
									form.getValues("images")?.filter((x, j) => j !== 0),
								)
							}
							className="absolute -right-1 -top-1 size-4 rounded-full"
						>
							<Icons.x />
						</Button>
					) : null}
				</div>
				<div className="grid grid-cols-3 gap-2">
					<div className="relative">
						<Image
							alt="Product image"
							className="aspect-square w-full rounded-md object-cover object-center"
							height="300"
							src={form.watch("images")?.[1] ?? "https://ui.shadcn.com/placeholder.svg"}
							width="300"
						/>
						{form.watch("images")?.[1] ? (
							<Button
								variant="destructive"
								size="icon"
								onClick={() =>
									form.setValue(
										"images",
										form.getValues("images")?.filter((x, j) => j !== 1),
									)
								}
								className="absolute -right-1 -top-1 size-4 rounded-full"
							>
								<Icons.x />
							</Button>
						) : null}
					</div>

					{form.watch("images")?.["length"] > 3 ? (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<button
									type="button"
									className="rounded-md border border-dashed text-muted-foreground"
								>
									+{form.watch("images")?.["length"]}
								</button>
							</AlertDialogTrigger>
							<AlertDialogContent className="max-h-[95svh] overflow-auto rounded-md">
								<AlertDialogHeader>
									<AlertDialogTitle className="justify-start">edit images</AlertDialogTitle>
									<AlertDialogDescription className="max-w-prose">
										edit images
									</AlertDialogDescription>
								</AlertDialogHeader>

								<Tabs defaultValue="0">
									<TabsList className="h-auto w-full max-w-full flex-1 justify-stretch gap-4 overflow-auto bg-transparent">
										{form.watch("images")?.map((e, i) => (
											<TabsTrigger key={i} value={i?.toString()} className="w-fit p-0">
												<Image
													alt="Product image"
													className="aspect-square size-16 rounded-md object-cover object-center"
													src={e}
													height={999999}
													width={999999}
												/>
											</TabsTrigger>
										))}
									</TabsList>
									{form.watch("images")?.map((e, i) => (
										<TabsContent key={i} value={i?.toString()}>
											<div className="relative">
												<Image
													alt="Product image"
													className="aspect-square w-full rounded-md object-cover object-center"
													height="300"
													src={e ?? "https://ui.shadcn.com/placeholder.svg"}
													width="300"
												/>
												{e ? (
													<Button
														variant="destructive"
														size="icon"
														onClick={() =>
															form.setValue(
																"images",
																form.getValues("images")?.filter((x, j) => j !== i),
															)
														}
														className="absolute -right-1 -top-1 size-4 rounded-full"
													>
														<Icons.x />
													</Button>
												) : null}
											</div>
										</TabsContent>
									))}
								</Tabs>

								<AlertDialogFooter>
									<Button disabled={loading} className="w-full md:w-fit">
										Confirm
									</Button>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					) : (
						<div className="relative">
							<Image
								alt="Product image"
								className="aspect-square w-full rounded-md object-cover object-center"
								height="300"
								src={form.watch("images")?.[2] ?? "https://ui.shadcn.com/placeholder.svg"}
								width="300"
							/>
							{form.watch("images")?.[2] ? (
								<Button
									variant="destructive"
									size="icon"
									onClick={() =>
										form.setValue(
											"images",
											form.getValues("images")?.filter((x, j) => j !== 2),
										)
									}
									className="absolute -right-1 -top-1 size-4 rounded-full"
								>
									<Icons.x />
								</Button>
							) : null}
						</div>
					)}

					<FormField
						control={form?.["control"]}
						name={`images.${0}`}
						render={({ field }) => (
							<FormItem className="relative">
								<div className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed">
									<div className="relative">
										<Icons.upload className="h-4 w-4 text-muted-foreground" />
									</div>
									{/* <FormLabel className="sr-only">{c?.["label"]} </FormLabel> */}
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

												for (let i = 0; i < (files?.["length"] as number); i++) {
													const file = files?.[i];
													if (file) {
														const base64 = (await fileToBase64({ file }))?.toString();
														// @ts-expect-error
														imagesForm.append(base64 ?? "");
													}
												}
											}}
											className="absolute h-full w-full cursor-pointer rounded-full p-0 opacity-0"
										/>
									</FormControl>
								</div>

								<FormMessage />
							</FormItem>
						)}
					/>

					{/* <button
					type="button"
					className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed"
				>
					<Icons.upload className="h-4 w-4 text-muted-foreground" />
					<span className="sr-only">Upload</span>
				</button> */}
				</div>
			</div>
		);
	},
};
