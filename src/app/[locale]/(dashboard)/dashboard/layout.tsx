import { getAuth } from "@/lib/lucia";
import { LocaleProps } from "@/types/locale";
import { redirect } from "next/navigation";

type DashboardLayoutProps = Readonly<{
	children: React.ReactNode;
	params: Promise<LocaleProps>;
}>;

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
	const { locale } = await params;
	const { user } = await getAuth();
	if (!user) redirect(`/${locale}/login`);

	const stores = await db.store.findMany({ where: { userId: user?.["id"] } });
	if (!stores?.["length"]) redirect(`/${locale}/create-first-store`);

	const items = {
		content: [
			{
				label: "",
				items: [
					{
						label: "Overview",
						value: "/dashboard",
						icon: <LayoutDashboard />,
					},
				],
			},
			{
				label: "Store",
				items: [
					{
						label: "Products",
						value: "/dashboard/products",
						icon: <Gift />,
					},
					{
						label: "Customers",
						value: "/dashboard/customers",
						icon: <Users />,
					},
					{
						label: "Orders",
						value: "/dashboard/orders",
						icon: <PackagePlus />,
					},
					{
						label: "Promotions",
						value: "/dashboard/promotions",
						icon: <Percent />,
					},
				],
			},
			// {
			// 	label: "Analytics",
			// 	items: [
			// 		{
			// 			label: "Sales",
			// 			value: "/dashboard/sales",
			// 			// icon: <Insihj />,
			// 		},
			// 	],
			// },
		],
		footer: [
			{
				items: [
					{
						label: "Settings",
						value: "/dashboard/settings",
						icon: <Settings />,
					},
					{
						label: "Support",
						value: "/dashboard/settings",
						icon: <LifeBuoy />,
					},
					{
						label: "Feedback",
						value: "/dashboard/settings",
						icon: <Send />,
					},
				],
			},
		],
	};

	return (
		<SidebarProvider>
			<SidebarWrapper variant="inset" collapsible="icon">
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton size="lg" asChild>
								<LocaleLink href="#">
									<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
										<Command className="size-4" />
									</div>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-semibold">{stores?.[0]?.["name"]}</span>
										<span className="truncate text-xs">{stores?.[0]?.["category"]} </span>
									</div>
								</LocaleLink>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>

				<SidebarContent>
					{items?.["content"]?.map((g, i) => <SidebarGroupStructure key={i} group={g} />)}
				</SidebarContent>

				<SidebarFooter>
					{items?.["footer"]?.map((g, i) => (
						<SidebarGroupStructure key={i} group={g} className="px-0" />
					))}
					{user ? (
						<SidebarGroup className="px-0">
							<SidebarMenu>
								<SidebarMenuItem>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<SidebarMenuButton
												size="lg"
												className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
												tooltip={user?.["name"]}
											>
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
												<ChevronsUpDown className="ml-auto size-4" />
											</SidebarMenuButton>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
											side="bottom"
											align="end"
											sideOffset={4}
										>
											<DropdownMenuLabel className="p-0 font-normal">
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
												<DropdownMenuItem>
													<Sparkles />
													Upgrade to Pro
												</DropdownMenuItem>
											</DropdownMenuGroup>

											<DropdownMenuSeparator />
											<DropdownMenuItem
											// onClick={() => toast.promise(logout(), { loading: "logging out..." })}
											>
												<Icons.logout />
												Log out
											</DropdownMenuItem>
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

import {
	ChevronRight,
	ChevronsUpDown,
	Command,
	Gift,
	LayoutDashboard,
	LifeBuoy,
	PackagePlus,
	Percent,
	Send,
	Settings,
	Sparkles,
	Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Icons } from "@/components/icons";
import { LocaleLink } from "@/components/locale-link";
import { db } from "@/lib/prisma";

type Group = {
	label?: string;
	items: { value: string; label: string; icon?: React.ReactNode; items?: any[] }[];
};

const SidebarGroupStructure = ({
	group: g,
	...props
}: { group: Group } & React.DetailedHTMLProps<
	React.HTMLAttributes<HTMLDivElement>,
	HTMLDivElement
>) => {
	return (
		<SidebarGroup {...props}>
			{g?.["label"] && <SidebarGroupLabel>{g?.["label"]}</SidebarGroupLabel>}
			{g?.["items"] && (
				<SidebarMenu>
					{g?.["items"].map((e, j) => {
						if (!e?.["items"])
							return (
								<SidebarMenuItem key={j}>
									<SidebarMenuButton asChild tooltip={e?.["label"]}>
										<LocaleLink href={e?.["value"]}>
											{e?.["icon"]}
											<span>{e?.["label"]}</span>
										</LocaleLink>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);

						return (
							<Collapsible key={j} asChild>
								<SidebarMenuItem>
									<SidebarMenuButton asChild tooltip={e?.["label"]}>
										<LocaleLink href={e?.["value"]}>
											{e?.["icon"]}
											<span>{e?.["label"]}</span>
										</LocaleLink>
									</SidebarMenuButton>

									{e?.["items"]?.["length"] && (
										<>
											<CollapsibleTrigger asChild>
												<SidebarMenuAction className="data-[state=open]:rotate-90">
													<ChevronRight />
													<span className="sr-only">Toggle</span>
												</SidebarMenuAction>
											</CollapsibleTrigger>
											<CollapsibleContent>
												<SidebarMenuSub>
													{e.items.map((ee, k) => (
														<SidebarMenuSubItem key={k}>
															<SidebarMenuSubButton asChild>
																<LocaleLink href={ee?.["value"]}>
																	<span>{ee?.["label"]}</span>
																</LocaleLink>
															</SidebarMenuSubButton>
														</SidebarMenuSubItem>
													))}
												</SidebarMenuSub>
											</CollapsibleContent>
										</>
									)}
								</SidebarMenuItem>
							</Collapsible>
						);
					})}
				</SidebarMenu>
			)}
		</SidebarGroup>
	);
};
