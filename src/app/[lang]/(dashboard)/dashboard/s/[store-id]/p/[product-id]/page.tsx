import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LocaleProps } from "@/types/locale";
import { ProductDeleteButton } from "@/components/_products/product-delete-button";
import { getAuth } from "@/lib/auth";
import { getDictionary } from "@/lib/locale";
import { db } from "@/lib/db";
import { Link } from "@/components/link";
import { ProductEditor } from "@/components/_products/product-editor";
import { ProductAttribute } from "@/types/db";

type ProductProps = Readonly<{
	params: Promise<
		{
			"store-id": string;
			"product-id": string;
		} & LocaleProps
	>;
}>;
export const metadata: Metadata = { title: "Product" };
export default async function Product({ params }: ProductProps) {
	const { lang, "store-id": storeId, "product-id": productId } = await params;
	const user = (await getAuth())?.["user"]!;
	const dic = await getDictionary(lang);
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
		<>
			<div className="container">
				<ProductEditor dic={dic} product={product} attributes={rAttributes} />
			</div>
		</>
	);
}
