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
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/avatar";
import { Icons } from "@/components/icons";
import { NavLink } from "@/components/nav-link";
import { Tooltip } from "@/components/tooltip";
import { StoreUpdateButton } from "@/components/_stores/store-update-button";

type StoreLayoutProps = Readonly<{
	children: React.ReactNode;
	params: Promise<{ "store-id": string } & LocaleProps>;
}>;

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
	const { lang, "store-id": storeId } = await params;
	const { user } = await getAuth();
	const {
		site,
		marketing: { "main-nav": mainNav, layout: c },
		...dic
	} = await getDictionary(lang);
	const store = await db.store.findUnique({
		include: { products: true },
		where: {
			id: storeId,
			userId: user?.["id"] ?? "",
		},
	});
	if (!store) return <div className="container">NO STORE</div>;

	const navs = [
		{
			segments: null,
			value: `/dashboard/s/${store?.["id"]}`,
			label: "Dashboard",
			disabled: false,
		},
		{
			segments: ["products"],
			value: `/dashboard/s/${store?.["id"]}/products`,
			label: "Products",
		},
	];

	return (
		<div className="flex min-h-screen flex-col">
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

					<div className="flex items-center gap-2">
						<Link
							href={`/s/${storeId}`}
							target="_blank"
							className={cn(buttonVariants({ variant: "ghost" }))}
						>
							Preview
						</Link>
						<StoreDeleteButton dic={dic} store={store} variant="destructive" />
					</div>
				</div>

				<div className="z-40 border-b bg-background py-2">
					<div className="container flex max-w-screen-2xl items-center justify-between">
						<div className="flex items-center gap-4">
							<div>
								<Tooltip tip={"preview"}>
									<div>
										<Link href={`/s/${storeId}`} className="flex items-center gap-2">
											<Avatar
												user={{ name: store?.["name"], image: store?.["logo"] ?? null }}
												icon={{ name: "store" }}
												className="size-8"
											/>
											<span className="text-sm font-medium">{store?.["name"]}</span>
										</Link>
									</div>
								</Tooltip>
							</div>
							{navs?.["length"] ? (
								<nav>
									<ul className="flex items-center justify-start gap-2 text-sm">
										{navs.map((item, i) => (
											<li key={i}>
												<NavLink
													href={item?.["value"]}
													disabled={item?.["disabled"]}
													segments={item?.["segments"]}
													className={cn(
														buttonVariants({ variant: "ghost" }),
														"text-muted-foreground",
													)}
													activeClassNames="border-foreground text-primary underline underline-offset-[21px]"
												>
													{item?.["label"]}
												</NavLink>
											</li>
										))}
									</ul>
								</nav>
							) : null}
						</div>

						<div>
							<StoreUpdateButton dic={dic} store={store} variant="ghost" size="icon">
								<Icons.settings />
							</StoreUpdateButton>
						</div>
					</div>
				</div>
			</header>

			<main className="flex flex-1 flex-col">{children}</main>
		</div>
	);
}
