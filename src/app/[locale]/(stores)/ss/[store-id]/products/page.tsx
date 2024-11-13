import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";
import { Breadcrumbs } from "@/components/ss/breadcrumbs";
import { ProductsTable } from "@/components/_products/products-table";
import { getDictionary } from "@/lib/locale";
import { ProductCreateButton } from "@/components/_products/product-create-button";
import { Icons } from "@/components/icons";
import { db } from "@/lib/prisma";
import { ProductAttribute } from "@/types/db";
import { Product } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ProductsProps = Readonly<{
	params: Promise<{ "store-id": string } & LocaleProps>;
}>;
export const metadata: Metadata = { title: "Products" };
export default async function Products({ params }: ProductsProps) {
	const { locale, "store-id": storeId } = await params;
	const dic = await getDictionary({ locale });
	const c = dic?.["ss"]?.["store"]?.["products"];
	const products = (await db.product.findMany({ where: { storeId } })) as (Product & {
		attributes: ProductAttribute[];
	})[];

	const tabs = [
		{
			value: "all",
			label: c?.["tabs"]?.["all"],
			content: <ProductsTable dic={dic} data={products} />,
		},
		{
			value: "ACTIVE",
			label: c?.["tabs"]?.["active"],
			content: (
				<ProductsTable dic={dic} data={products?.filter((e) => e?.["status"] == "ACTIVE")} />
			),
		},
		{
			value: "DRAFT",
			label: c?.["tabs"]?.["draft"],
			content: <ProductsTable dic={dic} data={products?.filter((e) => e?.["status"] == "DRAFT")} />,
		},
		{
			value: "ARCHIVE",
			label: c?.["tabs"]?.["archive"],
			content: (
				<ProductsTable dic={dic} data={products?.filter((e) => e?.["status"] == "ARCHIVE")} />
			),
		},
	];
	return (
		<div>
			<Breadcrumbs items={[{ segments: [], value: "", label: c?.["products"] }]} />
			<div className="container flex items-center justify-between gap-2">
				<div>
					<h1 className="flex items-center gap-2 text-2xl font-semibold">
						<Icons.shirt className="size-5" />
						{c?.["products"]}
					</h1>
					<p className="max-w-prose text-sm text-muted-foreground">
						{c?.["browse all products, edit, and filter."]}
					</p>
				</div>
				<div>
					<ProductCreateButton dic={dic} store={{ id: storeId }} />
				</div>
			</div>

			<div className="container py-4">
				<Tabs defaultValue="all">
					<TabsList className="justify-start rtl:flex-row-reverse">
						{tabs?.map((e, i) => (
							<TabsTrigger key={i} value={e?.["value"]} className="w-fit">
								{e?.["label"]}
							</TabsTrigger>
						))}
					</TabsList>

					{tabs?.map((e, i) => (
						<TabsContent key={i} value={e?.["value"]}>
							{e?.["content"]}
						</TabsContent>
					))}
				</Tabs>
			</div>
		</div>
	);
}
