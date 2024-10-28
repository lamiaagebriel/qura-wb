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

	if (!r) return <div className="container">NO PRODUCT</div>;
	const product = { ...r, attributes: r?.["attributes"] as ProductAttribute[] };

	return (
		<>
			<header className="container space-y-4">
				<div className="flex h-16 shrink-0 items-center justify-between gap-2">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1" />
						<Separator orientation="vertical" className="mr-2 h-4" />
						<Breadcrumb
							items={[
								{ value: `/dashboard/stores`, label: "Stores" },
								{
									value: `/dashboard/s/${product?.["store"]?.["id"]}`,
									label: product?.["store"]?.["name"],
								},
								{
									value: `/dashboard/s/${product?.["store"]?.["id"]}/products`,
									label: "Products",
								},
								{
									value: "",
									label: product?.["name"],
								},
							]}
						/>
					</div>

					<div>
						<ProductDeleteButton dic={dic} product={product} variant="destructive" />
					</div>
				</div>
			</header>

			<div className="container">
				<ProductEditor dic={dic} product={product} />
			</div>
		</>
	);
}
