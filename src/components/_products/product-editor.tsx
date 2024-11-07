"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useFieldArray, useForm, UseFormReturn } from "react-hook-form";
import * as z from "zod";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { productUpdateSchema } from "@/validations/products";
import { Product } from "@prisma/client";

import { Icons } from "@/components/icons";
import { CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Link } from "@/components/link";
import { ProductAttribute } from "@/types/db";
import { ProductForm, ProductFormProps } from "./_product-form";
import { Badge } from "../ui/badge";
import { Dictionary } from "@/types/locale";
import { AttributeFormProps, AttributesForm } from "./_attribute-form";
import { useRouter } from "next/navigation";
import { updateProduct } from "@/servers/products";
import { toast, Toaster } from "sonner";
import { ProductDeleteButton, ProductDeleteButtonProps } from "./product-delete-button";

type ProductEditorProps = {
	product: Product & { attributes: ProductAttribute[] };
	attributes: ProductAttribute[];
} & Dictionary["product-editor"] &
	Pick<ProductFormProps, "dic"> &
	Pick<AttributeFormProps, "dic"> &
	Pick<ProductDeleteButtonProps, "dic">;

export function ProductEditor({
	dic: { "product-editor": c, ...dic },
	product,
	attributes,
}: ProductEditorProps) {
	const router = useRouter();
	const [loading, setLoading] = useState<boolean>(false);

	const form = useForm<z.infer<typeof productUpdateSchema>>({
		resolver: zodResolver(productUpdateSchema),
		defaultValues: { ...product },
	});

	async function onSubmit(data: z.infer<typeof productUpdateSchema>) {
		try {
			setLoading(true);
			const result = await updateProduct(data);
			if (result && typeof result === "object" && "error" in result) {
				toast.error(result?.["error"]);
				return;
			}

			form.reset({ ...data });
			toast.success(c?.["updated successfully."]);
			router.refresh();
		} catch (err: any) {
			toast.error(err?.["message"]);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
			<main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
				<div className="mx-auto grid max-w-screen-lg flex-1 auto-rows-max gap-4">
					<div className="flex items-center gap-4">
						<Link
							href={`/dashboard/s/${product?.["storeId"]}/products`}
							className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 w-7")}
							disabled={loading}
						>
							<Icons.chevronLeft />
							<span className="sr-only">{c?.["back"]}</span>
						</Link>

						<h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
							Product Details
						</h1>
						<Badge variant="outline" className="ml-auto sm:ml-0">
							In stock
						</Badge>
						<div className="hidden items-center gap-2 md:ml-auto md:flex">
							<ProductDeleteButton dic={dic} product={product} variant="destructive" size="sm" />
							<Form {...form}>
								<form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={loading}
										onClick={() => form.reset()}
									>
										{c?.["discard"]}
									</Button>
									<Button type="submit" size="sm" disabled={loading}>
										{loading && <Icons.spinner />}
										{c?.["save changes"]}
									</Button>
								</form>
							</Form>
						</div>
					</div>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)}>
							<div className="grid gap-4 md:grid-cols-[1fr,250px] lg:grid-cols-3 lg:gap-8">
								<div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
									<Card>
										<CardHeader>
											<CardTitle>Product Details</CardTitle>
											<CardDescription>
												Lipsum dolor sit amet, consectetur adipiscing elit
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="grid gap-6">
												<ProductForm.name dic={dic} form={form as any} loading={loading} />
												<ProductForm.description dic={dic} form={form as any} loading={loading} />
											</div>
										</CardContent>
									</Card>

									<Card>
										<CardHeader>
											<CardTitle>Stock</CardTitle>
											<CardDescription>
												Lipsum dolor sit amet, consectetur adipiscing elit
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="grid grid-cols-2 gap-4">
												<ProductForm.price dic={dic} form={form as any} loading={loading} />
												<ProductForm.stock dic={dic} form={form as any} loading={loading} />
											</div>
											<AttributesForm
												dic={dic}
												form={form as any}
												loading={loading}
												attributes={attributes}
											/>
											{/* <TruthTable form={form} loading={loading} /> */}
										</CardContent>
										<CardFooter className="justify-center border-t p-4">
											{/* <HandleOptions form={form} loading={loading} /> */}
										</CardFooter>
									</Card>

									{/* <Card>
											<CardHeader>
												<CardTitle>Product Category</CardTitle>
											</CardHeader>
											<CardContent>
												<div className="grid gap-6 sm:grid-cols-3">
													<div className="grid gap-3">
														<Label htmlFor="category">Category</Label>
														<Select>
													<SelectTrigger id="category" aria-label="Select category">
														<SelectValue placeholder="Select category" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="clothing">Clothing</SelectItem>
														<SelectItem value="electronics">Electronics</SelectItem>
														<SelectItem value="accessories">Accessories</SelectItem>
													</SelectContent>
												</Select>
													</div>
													<div className="grid gap-3">
														<Label htmlFor="subcategory">Subcategory (optional)</Label>
														<Select>
													<SelectTrigger id="subcategory" aria-label="Select subcategory">
														<SelectValue placeholder="Select subcategory" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="t-shirts">T-Shirts</SelectItem>
														<SelectItem value="hoodies">Hoodies</SelectItem>
														<SelectItem value="sweatshirts">Sweatshirts</SelectItem>
													</SelectContent>
												</Select>
													</div>
												</div>
											</CardContent>
										</Card> */}
								</div>
								<div className="grid auto-rows-max items-start gap-4 lg:gap-8">
									<Card>
										<CardHeader>
											<CardTitle>Product Status</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="grid gap-6">
												<div className="grid gap-3">
													<ProductForm.status dic={dic} form={form as any} loading={loading} />
												</div>
											</div>
										</CardContent>
									</Card>
									<Card className="overflow-hidden">
										<CardHeader>
											<CardTitle>Product Images</CardTitle>
											{/* <CardDescription>
													Lipsum dolor sit amet, consectetur adipiscing elit
												</CardDescription> */}
										</CardHeader>
										<CardContent>
											<ProductForm.images dic={dic} form={form as any} loading={loading} />
										</CardContent>
									</Card>
									<Card>
										<CardHeader>
											<CardTitle>Archive Product</CardTitle>
											<CardDescription>
												Lipsum dolor sit amet, consectetur adipiscing elit.
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div></div>
											<Button size="sm" variant="secondary">
												Archive Product
											</Button>
										</CardContent>
									</Card>
								</div>
							</div>
						</form>
					</Form>
					<div className="flex items-center justify-center gap-2 md:hidden">
						<ProductDeleteButton dic={dic} product={product} variant="destructive" size="sm" />
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
								<Button variant="outline" size="sm" onClick={() => form.reset()}>
									{c?.["discard"]}
								</Button>
								<Button type="submit" size="sm" disabled={loading}>
									{loading && <Icons.spinner />}
									{c?.["save changes"]}
								</Button>
							</form>
						</Form>
					</div>
				</div>
			</main>
		</div>
	);
}
