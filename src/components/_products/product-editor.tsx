"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { productUpdateSchema } from "@/validations/products";
import { Product } from "@prisma/client";

import { Icons } from "@/components/icons";
import { CardFooter, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { cn } from "@/lib/shadcn";
import { ProductAttribute } from "@/types/db";
import { ProductForm, ProductFormProps } from "@/components/_products/_product-form";
import { Badge } from "@/components/ui/badge";
import { Dictionary } from "@/types/locale";
import { AttributeFormProps, AttributesForm } from "@/components/_products/_attribute-form";
import { useRouter } from "next/navigation";
import { updateProduct } from "@/servers/products";
import { toast } from "sonner";
import {
	ProductDeleteButton,
	ProductDeleteButtonProps,
} from "@/components/_products/product-delete-button";
import { LocaleLink } from "../links";
import { productStatus } from "@/constants/enums";
import { useLocale } from "@/hooks/use-locale";

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
	const locale = useLocale();
	const router = useRouter();
	const [loading, setLoading] = useState<boolean>(false);

	const form = useForm<z.infer<typeof productUpdateSchema>>({
		resolver: zodResolver(productUpdateSchema),
		defaultValues: {
			...product,
			cost: product?.["cost"] ?? 0,
			discount: product?.["discount"] ?? 0,
		},
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
		<main className="flex flex-col gap-4">
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<LocaleLink
						href={`/ss/${product?.["storeId"]}/products`}
						className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 w-7")}
						disabled={loading}
					>
						<Icons.arrowLeft className="rtl:rotate-180" />
						<span className="sr-only">{c?.["back"]}</span>
					</LocaleLink>

					<h1 className="flex-1 text-xl font-semibold tracking-tight">{c?.["product details"]}</h1>
					<Badge variant="outline">
						{
							productStatus({ locale })?.find((e) => e?.["value"] === product?.["status"])?.[
								"label"
							]
						}
					</Badge>
				</div>

				<div className="hidden items-center gap-2 md:flex">
					<ProductDeleteButton
						dic={dic}
						product={product}
						variant="destructive"
						size="sm"
						disabled={loading}
					/>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
							<Button variant="outline" size="sm" disabled={loading} onClick={() => form.reset()}>
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
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="grid gap-2 md:grid-cols-[1fr,250px] lg:grid-cols-3 lg:gap-4"
				>
					<div className="grid auto-rows-max items-start gap-2 lg:col-span-2 lg:gap-4">
						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium uppercase text-muted-foreground">
									{c?.["product details"]}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid gap-2">
									<ProductForm.name dic={dic} form={form as any} loading={loading} />
									<ProductForm.slug dic={dic} form={form as any} loading={loading} />
									<ProductForm.description dic={dic} form={form as any} loading={loading} />
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium uppercase text-muted-foreground">
									{c?.["price"]}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ProductForm.cost dic={dic} form={form as any} loading={loading} />
								<ProductForm.price dic={dic} form={form as any} loading={loading} />
								<ProductForm.discount dic={dic} form={form as any} loading={loading} />
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium uppercase text-muted-foreground">
									{c?.["stock"]}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ProductForm.stock dic={dic} form={form as any} loading={loading} />
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium uppercase text-muted-foreground">
									{c?.["options"]}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<AttributesForm
									dic={dic}
									form={form as any}
									loading={loading}
									attributes={attributes}
								/>
							</CardContent>
						</Card>
					</div>
					<div className="grid auto-rows-max items-start gap-2 lg:gap-4">
						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium uppercase text-muted-foreground">
									{dic?.["product-form"]?.["status"]?.["status"]}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid gap-2">
									<ProductForm.status dic={dic} form={form as any} loading={loading} />
								</div>
							</CardContent>
						</Card>
						<Card className="overflow-hidden">
							<CardHeader>
								<CardTitle className="text-sm font-medium uppercase text-muted-foreground">
									{c?.["images"]}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ProductForm.images dic={dic} form={form as any} loading={loading} />
							</CardContent>
						</Card>
					</div>
				</form>
			</Form>

			<div className="flex items-center justify-center gap-2 md:hidden">
				<ProductDeleteButton
					dic={dic}
					product={product}
					variant="destructive"
					size="sm"
					disabled={loading}
				/>
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
		</main>
	);
}
