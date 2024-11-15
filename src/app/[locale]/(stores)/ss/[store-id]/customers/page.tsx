import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";
import { Breadcrumbs } from "@/components/ss/breadcrumbs";
import { CustomersTable } from "@/components/_customers/customers-table";
import { getDictionary } from "@/lib/locale";
import { Icons } from "@/components/icons";
import { db } from "@/lib/prisma";

type CustomersProps = Readonly<{
	params: Promise<{ "store-id": string } & LocaleProps>;
}>;
export const metadata: Metadata = { title: "Customers" };
export default async function Customers({ params }: CustomersProps) {
	const { locale, "store-id": storeId } = await params;
	const dic = await getDictionary({ locale });
	const c = dic?.["ss"]?.["store"]?.["customers"];

	const customers = await db.user.findMany({});

	return (
		<div>
			<Breadcrumbs items={[{ segments: [], value: "", label: c?.["customers"] }]} />
			<div className="container flex items-center justify-between gap-2">
				<div>
					<h1 className="flex items-center gap-2 text-2xl font-semibold">
						<Icons.users className="size-5" />
						{c?.["customers"]}
					</h1>
					<p className="max-w-prose text-sm text-muted-foreground">
						{c?.["browse all customers, preview, and filter."]}
					</p>
				</div>
				{/* <div>
					<OrderCreateButton dic={dic} store={{ id: storeId }} products={products} />
				</div> */}
			</div>

			<div className="container py-4">
				<CustomersTable dic={dic} data={customers} store={{ id: storeId }} />
			</div>
		</div>
	);
}
