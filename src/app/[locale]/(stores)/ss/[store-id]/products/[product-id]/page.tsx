import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";
import { Breadcrumbs } from "@/components/ss/breadcrumbs";
import { getDictionary } from "@/lib/locale";
import { db } from "@/lib/prisma";
import { ProductAttribute } from "@/types/db";
import { getAuth } from "@/lib/lucia";
import { ProductEditor } from "@/components/_products/product-editor";

type ProductProps = Readonly<{
	params: Promise<{ "store-id": string; "product-id": string } & LocaleProps>;
}>;
export const metadata: Metadata = { title: "Product" };
export default async function Product({ params }: ProductProps) {
	const { locale, "store-id": storeId, "product-id": productId } = await params;
	const user = (await getAuth())?.["user"]!;
	const dic = await getDictionary({ locale });
	const r = await db.product.findUnique({
		include: { store: { select: { id: true, name: true } } },
		where: {
			id: productId,
			storeId,
		},
	});
	const rAttributes = (
		await db.product.findMany({
			select: { attributes: true },
			where: { storeId: storeId },
		})
	)
		?.map((e) => e?.["attributes"] as ProductAttribute[])
		?.flat();

	if (!r) return <div className="container">NO PRODUCT</div>;
	const product = { ...r, attributes: r?.["attributes"] as ProductAttribute[] };

	return (
		<div>
			<Breadcrumbs
				items={[
					{ segments: [], value: `/ss/${storeId}/products`, label: "Products" },
					{ segments: [], value: ``, label: product?.["name"] },
				]}
			/>

			<div className="container">
				<ProductEditor dic={dic} product={product} attributes={rAttributes} />
			</div>
		</div>
	);
}
