import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { StoreCreateButton } from "@/components/_stores/store-create-button";
import { LocaleProps } from "@/types/locale";
import { getDictionary } from "@/lib/locale";
import { db } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { StoresTable } from "@/components/_stores/stores-table";

type StoresProps = Readonly<{
	params: Promise<LocaleProps>;
}>;
export const metadata: Metadata = { title: "Stores" };
export default async function Stores({ params }: StoresProps) {
	const { lang } = await params;
	const user = (await getAuth())?.["user"]!;
	const dic = await getDictionary(lang);
	const stores = await db.store.findMany({ where: { userId: user?.["id"] ?? "" } });

	return (
		<>
			<header className="flex h-16 shrink-0 items-center justify-between gap-2">
				<div className="flex items-center gap-2 px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 h-4" />
					<Breadcrumb items={[{ value: "", label: "Stores" }]} />
				</div>

				<div>
					<StoreCreateButton dic={dic} />
				</div>
			</header>

			<div className="container">
				<StoresTable dic={dic} data={stores} />
			</div>
		</>
	);
}
