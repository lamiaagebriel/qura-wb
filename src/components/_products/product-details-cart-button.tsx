"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Product } from "@prisma/client";
import { ProductAttribute } from "@/types/db";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cartProductSchema } from "@/lib/redux/validations";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/redux";
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
import React, { useState } from "react";

export type ProductDetailsCartButtonProps = {
	product: Product & { attributes: ProductAttribute[] };
	children: React.ReactNode;
};
// & Dictionary["product-create-button"] &
// Pick<ProductFormProps, "dic">;
export function ProductDetailsCartButton({
	// dic: { "product-create-button": c, ...dic },
	product,
	children,
}: ProductDetailsCartButtonProps) {
	const cart = useCart();
	const [open, setOpen] = useState<boolean>(false);
	const form = useForm<z.infer<typeof cartProductSchema>>({
		resolver: zodResolver(cartProductSchema),
		defaultValues: {
			product,
			attributes: product?.["attributes"]?.map((e) => ({
				name: e?.["name"],
				value:
					// e?.["values"]?.["0"]?.["name"] ??
					undefined,
			})),
			quantity: 1,
		},
	});

	async function onSubmit(data: z.infer<typeof cartProductSchema>) {
		cart.addToCart({
			...data,
		});
		setOpen(false);
	}

	return (
		<AlertDialog
			open={open}
			onOpenChange={(o) => {
				form.reset();
				setOpen(o);
			}}
		>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent className="rounded-md">
				<div className="max-h-[95svh] overflow-auto">
					<AlertDialogHeader className="flex-row items-center justify-between">
						<AlertDialogTitle className="justify-start">{product?.["name"]}</AlertDialogTitle>
						<p className="text-xl font-bold">${product?.["price"]}.05</p>
					</AlertDialogHeader>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
							<div className="space-y-4">
								{product?.["attributes"]?.map((e, i) => (
									<FormField
										key={i}
										control={form?.["control"]}
										name={`attributes.${i}.value`}
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-xs text-muted-foreground">
													Select {e?.["name"]}
												</FormLabel>
												<FormControl>
													<RadioGroup
														onValueChange={field.onChange}
														defaultValue={field?.["value"]}
														className="flex items-center gap-1"
													>
														{e?.["values"]?.map((v, j) => (
															<FormItem key={`${i}-${j}`}>
																<FormControl>
																	<RadioGroupItem value={v?.["name"]} className="peer sr-only" />
																</FormControl>
																<FormLabel className="flex cursor-pointer items-center rounded-full border border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground [&:has([data-state=checked])]:border-primary">
																	{v?.["name"]}
																</FormLabel>
															</FormItem>
														))}
													</RadioGroup>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								))}
							</div>

							<div>
								<FormField
									control={form?.["control"]}
									name="quantity"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Qantity</FormLabel>
											<FormControl>
												<div className="flex items-center gap-2">
													<div className="flex items-center gap-1 rounded-full border border-primary">
														<Button
															variant="ghost"
															size="icon"
															className="rounded-full"
															onClick={() => {
																form.setValue("quantity", form.getValues("quantity") + 1);
															}}
														>
															<Icons.add />
														</Button>
														<Input
															{...field}
															type="number"
															onChange={(e) =>
																field.onChange({
																	...e,
																	target: {
																		...e?.["target"],
																		value: Number(e?.["target"]?.["value"]),
																	},
																})
															}
															className="max-w-24 border-none shadow-none focus-visible:ring-0"
														/>

														<Button
															variant="ghost"
															size="icon"
															className="rounded-full"
															onClick={() => {
																form.setValue("quantity", form.getValues("quantity") - 1);
															}}
														>
															<Icons.minus />
														</Button>
													</div>

													<Button type="submit" className="flex-1 rounded-full py-4">
														Add To Cart
													</Button>

													<Button variant="outline" size="icon" className="rounded-full">
														<Icons.heart />
													</Button>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</form>
					</Form>

					<AlertDialogFooter>
						<AlertDialogCancel className="absolute right-0 top-0 size-8 -translate-y-1/3 translate-x-1/3 rounded-full">
							<Icons.x />
						</AlertDialogCancel>
					</AlertDialogFooter>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}
