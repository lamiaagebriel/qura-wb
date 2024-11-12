import { getAuth } from "@/lib/lucia";
import { LocaleProps } from "@/types/locale";
import { redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar as SidebarWrapper,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Icons } from "@/components/icons";
import { LocaleLink, NavLink } from "@/components/links";
import { db } from "@/lib/prisma";
import { StoreCreateButton } from "@/components/_stores/store-create-button";
import { getDictionary } from "@/lib/locale";
import { LogoutButton } from "@/components/_users/logout-button";

type DashboardLayoutProps = Readonly<{
	children: React.ReactNode;
	params: Promise<{ "store-id": string } & LocaleProps>;
}>;

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
	const { locale, "store-id": storeId } = await params;
	const { user } = await getAuth();
	const dic = await getDictionary({ locale });
	const c = dic?.["ss"];

	if (!user) redirect(`/${locale}/login`);
	const stores = await db.store.findMany({ where: { userId: user?.["id"] } });
	if (!stores?.["length"]) redirect(`/${locale}/create-store`);

	const selectedStore = stores?.find((e) => e?.["id"] === storeId);
	if (!selectedStore) return <div>NO STORE</div>;
	return (
		<SidebarProvider defaultOpen={false}>
			<SidebarWrapper side={locale === "ar" ? "right" : "left"} variant="inset" collapsible="icon">
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<SidebarMenuButton
										size="lg"
										className="flex-row items-center justify-between gap-4 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
										tooltip={selectedStore?.["name"]}
									>
										<div className="flex items-center gap-2">
											<Avatar className="flex aspect-square size-8 items-center justify-center rounded-lg border shadow-sm">
												<AvatarImage src={selectedStore?.["logo"]!} alt="" />
												<AvatarFallback className="rounded-none">
													{selectedStore?.["username"]?.[0]?.toUpperCase()}
												</AvatarFallback>
											</Avatar>

											<div className="flex flex-col gap-0.5 leading-none">
												<span className="font-semibold">{selectedStore?.["name"]}</span>
												<span className="text-xs text-muted-foreground">
													{selectedStore?.["username"]}
												</span>
											</div>
										</div>
										<Icons.chevronsUpDown />
									</SidebarMenuButton>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									className="w-[--radix-dropdown-menu-trigger-width]"
									align="start"
								>
									{stores?.map((e, i) => (
										<LocaleLink key={i} href={`/ss/${e?.["id"]}`}>
											<DropdownMenuItem className="flex cursor-pointer items-center justify-between gap-4">
												<div className="flex items-center justify-start gap-2">
													<Avatar className="flex aspect-square size-8 items-center justify-center rounded-lg border shadow-sm">
														<AvatarImage src={e?.["logo"]!} alt="" />
														<AvatarFallback className="rounded-none">
															{e?.["username"]?.[0]?.toUpperCase()}
														</AvatarFallback>
													</Avatar>

													<div className="flex flex-col gap-0.5 leading-none">
														<span className="font-semibold">{e?.["name"]}</span>
														<span className="text-xs text-muted-foreground">{e?.["username"]}</span>
													</div>
												</div>

												{e?.["id"] === storeId && <Icons.check />}
											</DropdownMenuItem>
										</LocaleLink>
									))}

									<DropdownMenuSeparator />

									<StoreCreateButton
										dic={dic}
										variant="ghost"
										className="w-full justify-start px-2 text-start font-normal"
									/>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>

				<SidebarContent>
					{c?.["store"]?.["navs"]?.slice(0, -1)?.map((g, i) => (
						<SidebarGroup key={i}>
							{g?.["label"] && <SidebarGroupLabel>{g?.["label"]}</SidebarGroupLabel>}
							{g?.["items"] && (
								<SidebarMenu>
									{g?.["items"]?.map((e, j) => {
										const Icon = e?.["icon"] ? (Icons[e?.["icon"]] ?? null) : null;

										return (
											<SidebarMenuItem key={`${i}-${j}`}>
												<SidebarMenuButton tooltip={e?.["label"]?.toString()} className="p-0">
													<NavLink
														href={`/ss/${storeId}${e?.["value"]}`}
														segments={e?.["segments"]}
														disabled={e?.["disabled"]}
														className="flex flex-1 items-center gap-2 p-2"
														activeClassNames="bg-primary text-primary-foreground"
													>
														{Icon && <Icon />}
														<span>{e?.["label"]}</span>
													</NavLink>
												</SidebarMenuButton>
											</SidebarMenuItem>
										);
									})}
								</SidebarMenu>
							)}
						</SidebarGroup>
					))}
				</SidebarContent>

				<SidebarFooter>
					{c?.["store"]?.["navs"]?.slice(-1)?.map((g, i) => (
						<SidebarGroup key={i} className="px-0">
							{g?.["label"] && <SidebarGroupLabel>{g?.["label"]}</SidebarGroupLabel>}
							{g?.["items"] && (
								<SidebarMenu>
									{g?.["items"].map((e, j) => {
										const Icon = e?.["icon"] ? (Icons[e?.["icon"]] ?? null) : null;
										return (
											<SidebarMenuItem key={`${i}-${j}`}>
												<SidebarMenuButton tooltip={e?.["label"]?.toString()} className="p-0">
													<NavLink
														href={`/ss/${storeId}${e?.["value"]}`}
														segments={e?.["segments"]}
														disabled={e?.["disabled"]}
														className="flex flex-1 items-center gap-2 p-2"
														activeClassNames="bg-primary text-primary-foreground"
													>
														{Icon && <Icon />}
														<span>{e?.["label"]}</span>
													</NavLink>
												</SidebarMenuButton>
											</SidebarMenuItem>
										);
									})}
								</SidebarMenu>
							)}
						</SidebarGroup>
					))}
					{user ? (
						<SidebarGroup className="px-0">
							<SidebarMenu>
								<SidebarMenuItem>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<SidebarMenuButton
												dir="ltr"
												size="lg"
												className="flex items-center justify-between gap-4 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
												tooltip={user?.["name"]}
											>
												<div className="flex items-center gap-2">
													<Avatar className="h-8 w-8 rounded-lg">
														<AvatarImage src={user?.["image"] ?? ""} alt={user?.["name"]} />
														<AvatarFallback className="rounded-lg">
															{user?.["name"]
																?.split(" ")
																?.slice(0, 2)
																?.map((e: string) => e?.[0]?.toUpperCase())
																?.join("")}
														</AvatarFallback>
													</Avatar>
													<div className="grid flex-1 text-left text-sm leading-tight">
														<span className="truncate font-semibold">{user?.["name"]}</span>
														<span className="truncate text-xs">{user?.["email"]}</span>
													</div>
												</div>
												<Icons.chevronsUpDown />
											</SidebarMenuButton>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
											side="bottom"
											align="end"
											sideOffset={4}
										>
											<DropdownMenuLabel dir="ltr" className="p-0 font-normal">
												<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
													<Avatar className="h-8 w-8 rounded-lg">
														<AvatarImage src={user?.["image"] ?? ""} alt={user?.["name"]} />
														<AvatarFallback className="rounded-lg">
															{user?.["name"]
																?.split(" ")
																?.slice(0, 2)
																?.map((e: string) => e?.[0]?.toUpperCase())
																?.join("")}
														</AvatarFallback>
													</Avatar>
													<div className="grid flex-1 text-left text-sm leading-tight">
														<span className="truncate font-semibold">{user?.["name"]}</span>
														<span className="truncate text-xs">{user?.["email"]}</span>
													</div>
												</div>
											</DropdownMenuLabel>

											<DropdownMenuSeparator />
											<DropdownMenuGroup>
												{c?.["store"]?.["userNavs"]?.map((e, i) => {
													const Icon = e?.["icon"] ? (Icons[e?.["icon"]] ?? null) : null;

													return (
														<LocaleLink key={i} href={e?.["value"]}>
															<DropdownMenuItem className="cursor-pointer bg-lime-400 font-medium hover:bg-lime-500">
																{Icon && <Icon />}
																{e?.["label"]}
															</DropdownMenuItem>
														</LocaleLink>
													);
												})}
											</DropdownMenuGroup>
											<DropdownMenuSeparator />
											<LogoutButton dic={dic} />
										</DropdownMenuContent>
									</DropdownMenu>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroup>
					) : null}
				</SidebarFooter>
			</SidebarWrapper>

			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}
