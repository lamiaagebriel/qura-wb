import type { Metadata } from "next";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LocaleProps } from "@/types/locale";
import { StoreDeleteButton } from "@/components/_stores/store-delete-button";
import { getAuth } from "@/lib/auth";
import { getDictionary } from "@/lib/locale";
import { db } from "@/lib/db";

type StoreProps = Readonly<{
	params: Promise<{ "store-id": string } & LocaleProps>;
}>;
export const metadata: Metadata = { title: "Store" };
export default async function Store({ params }: StoreProps) {
	const { lang, "store-id": storeId } = await params;
	const user = (await getAuth())?.["user"]!;
	const dic = await getDictionary(lang);
	const store = await db.store.findUnique({
		where: {
			id: storeId,
			userId: user?.["id"] ?? "",
		},
	});

	if (!store) return <div className="container">NO STORE</div>;

	return (
		<>
			<header className="flex h-16 shrink-0 items-center justify-between gap-2">
				<div className="flex items-center gap-2 px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 h-4" />
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className="hidden md:block">
								<BreadcrumbLink href="/dashboard/stores">Stores</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className="hidden md:block" />
							<BreadcrumbItem>
								<BreadcrumbPage>Store {store?.["name"]}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>

				<div>
					<StoreDeleteButton dic={dic} store={store} variant="destructive" />
				</div>
			</header>

			<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
				<div className="grid auto-rows-min gap-4 md:grid-cols-3">
					<div className="aspect-video rounded-xl bg-muted/50" />
					<div className="aspect-video rounded-xl bg-muted/50" />
					<div className="aspect-video rounded-xl bg-muted/50" />
				</div>
				<div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
			</div>
		</>
	);
}
