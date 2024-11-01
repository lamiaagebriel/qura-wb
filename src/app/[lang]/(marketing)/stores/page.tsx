import { Link } from "@/components/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import type { Metadata } from "next";

type StoresProps = Readonly<{}>;
export const metadata: Metadata = { title: "Stores" };
export default async function Stores({}: StoresProps) {
	const stores = await db.store.findMany({});
	if (!stores?.["length"]) return <>NO STORES</>;

	return (
		<div className="container py-4">
			<div className="grid grid-cols-4 gap-2">
				{stores?.map((e, i) => (
					<Card key={i}>
						<Link href={`/s/${e?.["id"]}`}>
							<CardHeader>
								<CardTitle>{e?.["name"]}</CardTitle>
							</CardHeader>
						</Link>
					</Card>
				))}
			</div>
		</div>
	);
}
