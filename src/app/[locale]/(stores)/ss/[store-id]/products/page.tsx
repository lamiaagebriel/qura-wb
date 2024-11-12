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

type ProductsProps = Readonly<{
	params: Promise<{ "store-id": string } & LocaleProps>;
}>;
export const metadata: Metadata = { title: "Products" };
export default async function Products({ params }: ProductsProps) {
	const { locale, "store-id": storeId } = await params;
	const dic = await getDictionary({ locale });
	const products = await db.product.findMany({ where: { storeId } });

	return (
		<div>
			<Breadcrumbs items={[{ segments: [], value: "", label: "Products" }]} />
			<div className="container flex items-center justify-between gap-2">
				<div>
					<h1 className="flex items-center gap-2 text-2xl font-semibold">
						<Icons.shirt className="size-5" />
						All Products
					</h1>
					<p className="max-w-prose text-sm text-muted-foreground">
						Lorem ipsum dolor sit amet, consectetur adipisicing elit.
					</p>
				</div>
				<div>
					<ProductCreateButton dic={dic} store={{ id: storeId }} />
				</div>
			</div>

			<div className="container py-4">
				<ProductsTable
					dic={dic}
					data={products as (Product & { attributes: ProductAttribute[] })[]}
				/>
			</div>
		</div>
	);
}
