import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LocaleProps } from "@/types/locale";
import { StoreDeleteButton } from "@/components/_stores/store-delete-button";
import { getAuth } from "@/lib/auth";
import { getDictionary } from "@/lib/locale";
import { db } from "@/lib/db";
import { Link } from "@/components/link";

type StoreProps = Readonly<{
	params: Promise<{ "store-id": string } & LocaleProps>;
}>;
export const metadata: Metadata = { title: "Store" };
export default async function Store({ params }: StoreProps) {
	const { lang, "store-id": storeId } = await params;
	const user = (await getAuth())?.["user"]!;
	const dic = await getDictionary(lang);
	const store = await db.store.findUnique({
		include: { products: true },
		where: {
			id: storeId,
			userId: user?.["id"] ?? "",
		},
	});

	if (!store) return <div className="container">NO STORE</div>;

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
								{ value: "", label: store?.["name"] },
							]}
						/>
					</div>

					<div>
						<StoreDeleteButton dic={dic} store={store} variant="destructive" />
					</div>
				</div>
				<div className="flex items-center gap-4">
					{[
						{ value: `/dashboard/s/${store?.["id"]}`, label: "Dashboard" },
						{ value: `/dashboard/s/${store?.["id"]}/products`, label: "Products" },
					]?.map((e, i) => (
						<Link key={i} href={e?.["value"]}>
							{e?.["label"]}
						</Link>
					))}
				</div>
			</header>

			<div className="container">Dashboard</div>
		</>
	);
}
