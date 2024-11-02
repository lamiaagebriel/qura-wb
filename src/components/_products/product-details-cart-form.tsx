"use client";

import { Icons } from "@/components/icons";
import { Button, ButtonProps } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { Product } from "@prisma/client";
import { ProductAttribute } from "@/types/db";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cartProductSchema } from "@/lib/redux/validations";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/redux";

export type ProductDetailsCartFormProps = {
	product: Product & { attributes: ProductAttribute[] };
};
// & Dictionary["product-create-button"] &
// Pick<ProductFormProps, "dic">;
export function ProductDetailsCartForm({
	// dic: { "product-create-button": c, ...dic },
	product,
}: ProductDetailsCartFormProps) {
	const cart = useCart();
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
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
				<div className="flex items-center justify-between">
					<h1 className="text-4xl font-semibold">{product?.["name"]}</h1>
					<p className="text-xl font-bold">${product?.["price"]}.05</p>
				</div>

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
														target: { ...e?.["target"], value: Number(e?.["target"]?.["value"]) },
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
	);
}
