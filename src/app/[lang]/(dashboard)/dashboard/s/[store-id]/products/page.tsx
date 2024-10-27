import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LocaleProps } from "@/types/locale";
import { getAuth } from "@/lib/auth";
import { getDictionary } from "@/lib/locale";
import { db } from "@/lib/db";
import { ProductsTable } from "@/components/_products/products-table";
import { ProductCreateButton } from "@/components/_products/product-create-button";
import { ProductAttribute } from "@/types/db";

type ProductProps = Readonly<{
	params: Promise<{ "store-id": string } & LocaleProps>;
}>;
export const metadata: Metadata = { title: "Product" };
export default async function Product({ params }: ProductProps) {
	const { lang, "store-id": storeId } = await params;
	const user = (await getAuth())?.["user"]!;
	const dic = await getDictionary(lang);
	const r = await db.store.findUnique({
		include: { products: true },
		where: {
			id: storeId,
			userId: user?.["id"] ?? "",
		},
	});

	if (!r) return <div className="container">NO STORE</div>;
	const store = {
		...r,
		products: r?.["products"].map((e) => ({
			...e,
			attributes: e?.["attributes"] as ProductAttribute[],
		})),
	};

	return (
		<>
			<header className="flex h-16 shrink-0 items-center justify-between gap-2">
				<div className="flex items-center gap-2 px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 h-4" />

					<Breadcrumb
						items={[
							{ value: `/dashboard/stores`, label: "Stores" },
							{ value: `/dashboard/s/${store?.["id"]}`, label: store?.["name"] },
							{ value: "", label: "Products" },
						]}
					/>
				</div>

				<div>
					<ProductCreateButton dic={dic} store={store} />
				</div>
			</header>

			<div className="container">
				<ProductsTable dic={dic} data={store?.["products"]} />
			</div>
		</>
	);
}
