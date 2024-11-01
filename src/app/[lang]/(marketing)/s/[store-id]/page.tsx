import type { Metadata } from "next";
import { Link } from "@/components/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { LocaleProps } from "@/types/locale";

type ProductsProps = Readonly<{ params: Promise<{ "store-id": string } & LocaleProps> }>;
export const metadata: Metadata = { title: "Products" };
export default async function Products({ params }: ProductsProps) {
	const { lang, "store-id": storeId } = await params;
	const store = await db.store.findUnique({
		include: { products: true },
		where: { id: storeId },
	});
	if (!store) return <>NO STORE</>;

	return (
		<div className="container py-4">
			<div className="grid grid-cols-4 gap-2">
				{store?.["products"]?.["length"] ? (
					store?.["products"]?.map((e, i) => (
						<Card key={i}>
							<Link href={`/s/${e?.["storeId"]}/p/${e?.["id"]}`}>
								<CardHeader>
									<CardTitle>{e?.["name"]}</CardTitle>
								</CardHeader>
							</Link>
						</Card>
					))
				) : (
					<>NO PRODUCTS</>
				)}
			</div>
		</div>
	);
}
