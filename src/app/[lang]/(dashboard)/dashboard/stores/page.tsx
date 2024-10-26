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
import { Link } from "@/components/link";
import { StoreCreateButton } from "@/components/_stores/store-create-button";
import { LocaleProps } from "@/types/locale";
import { getDictionary } from "@/lib/locale";
import { db } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StoreDeleteButton } from "@/components/_stores/store-delete-button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { StoreUpdateButton } from "@/components/_stores/store-update-button";

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
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbPage>Stores</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>

				<div>
					<StoreCreateButton dic={dic} />
				</div>
			</header>

			<div className="container grid grid-cols-5 gap-4">
				{stores?.["length"] ? (
					stores?.map((e, i) => (
						<Card key={i} className="relative">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="absolute right-4 top-4 data-[state=open]:bg-muted"
									>
										<DotsHorizontalIcon className="h-4 w-4 shrink-0" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-full min-w-40">
									<DropdownMenuLabel>My Account</DropdownMenuLabel>

									<DropdownMenuSeparator />
									<StoreUpdateButton
										dic={dic}
										store={e}
										variant="ghost"
										className="w-full justify-start px-2 text-start font-normal"
									/>
									<StoreDeleteButton
										dic={dic}
										store={e}
										variant="ghost"
										className="w-full justify-start px-2 text-start font-normal"
									/>
								</DropdownMenuContent>
							</DropdownMenu>

							<Link href={`/dashboard/s/${e?.["id"]}`}>
								<CardHeader>
									<CardTitle>{e?.["name"]}</CardTitle>
								</CardHeader>

								<CardFooter>
									<p className="w-full text-end text-xs text-muted-foreground">
										{new Date(e?.["createdAt"])?.toLocaleDateString()}
									</p>
								</CardFooter>
							</Link>
						</Card>
					))
				) : (
					<div className="container">NO STORES</div>
				)}
			</div>
		</>
	);
}
