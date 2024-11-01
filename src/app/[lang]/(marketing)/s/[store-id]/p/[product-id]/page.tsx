import type { Metadata } from "next";
import { db } from "@/lib/db";
import { LocaleProps } from "@/types/locale";

type ProductProps = Readonly<{
	params: Promise<{ "store-id": string; "product-id": string } & LocaleProps>;
}>;
export const metadata: Metadata = { title: "Product" };
export default async function Product({ params }: ProductProps) {
	const { lang, "store-id": storeId, "product-id": productId } = await params;
	const product = await db.product.findUnique({
		where: { id: productId, storeId },
	});

	if (!product) return <>NO PRODUCT</>;

	return <div className="container py-4">Product {product?.["id"]}</div>;
}
