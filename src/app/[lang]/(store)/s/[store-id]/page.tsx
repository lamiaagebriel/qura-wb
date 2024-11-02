import type { Metadata } from "next";
import { db } from "@/lib/db";
import { LocaleProps } from "@/types/locale";
import { ProductCard } from "@/components/_products/product-card";
import { ProductAttribute } from "@/types/db";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type ProductsProps = Readonly<{ params: Promise<{ "store-id": string } & LocaleProps> }>;
export const metadata: Metadata = { title: "Products" };
export default async function Products({ params }: ProductsProps) {
	const { lang, "store-id": storeId } = await params;
	const r = await db.product.findMany({
		where: { store: { id: storeId } },
	});
	if (!r?.["length"]) return <>NO PRODUCTS</>;

	const products = r?.map((e) => ({ ...e, attributes: e?.["attributes"] as ProductAttribute[] }));

	const attributes = Object.entries(
		r
			?.flatMap((product) => product?.["attributes"] as ProductAttribute[])
			.reduce(
				(acc, attribute) => {
					if (attribute) {
						// Ensure that the name exists in the accumulator
						if (!acc[attribute.name]) acc[attribute.name] = new Set<string>();

						// Add all values to the Set for that name to ensure uniqueness
						attribute.values.forEach((value) => acc[attribute.name].add(value?.["name"]));
					}
					return acc;
				},
				{} as Record<string, Set<string>>,
			),
	).map(([name, values]) => ({
		name,
		values: Array.from(values),
	}));

	return (
		<div className="container py-4">
			<div className="grid gap-1 sm:grid-cols-[0.2fr,1fr]">
				<div className="flex flex-col gap-4">
					{attributes.map((e, i) => (
						<Select
							key={i}
							// value={`${table.getState().pagination.pageSize}`}
							// onValueChange={(value) => table.setPageSize(Number(value))}
						>
							<SelectTrigger className="w-full bg-background">
								<SelectValue placeholder={`Select ${e?.["name"]}`} />
							</SelectTrigger>

							<SelectContent side="top">
								{e?.["values"]?.map((v, j) => (
									<SelectItem key={`${i}-${j}`} value={v}>
										{v}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					))}
				</div>
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{products?.map((e, i) => <ProductCard key={i} product={e} />)}
				</div>
			</div>
		</div>
	);
}
