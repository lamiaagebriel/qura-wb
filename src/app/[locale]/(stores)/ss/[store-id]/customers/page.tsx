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
	const customers = await db.user.findMany({});

	return (
		<div>
			<Breadcrumbs items={[{ segments: [], value: "", label: "Customers" }]} />
			<div className="container flex items-center justify-between gap-2">
				<div>
					<h1 className="flex items-center gap-2 text-2xl font-semibold">
						<Icons.users className="size-5" />
						All Customers
					</h1>
					<p className="max-w-prose text-sm text-muted-foreground">
						Lorem ipsum dolor sit amet, consectetur adipisicing elit.
					</p>
				</div>
			</div>

			<div className="container py-4">
				<CustomersTable dic={dic} data={customers} />
			</div>
		</div>
	);
}
