"use client";
import {
	BadgeCheck,
	Bell,
	BookOpen,
	Bot,
	ChevronRight,
	ChevronsUpDown,
	Command,
	CreditCard,
	Folder,
	Frame,
	LifeBuoy,
	LogOut,
	Map,
	MoreHorizontal,
	PieChart,
	Send,
	Settings2,
	Share,
	Sparkles,
	SquareTerminal,
	Trash2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { Separator } from "@/components/ui/separator";
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
import { useSession } from "./session-provider";
import { Icons } from "./icons";
import { toast } from "sonner";
import { logout } from "@/servers/users";
import { Fragment } from "react";
import { Link } from "./link";

type Group = {
	label?: string;
	items: { value: string; label: string; icon?: React.ReactNode; items?: any[] }[];
};
type SidebarProps = {
	children: React.ReactNode;
	items: {
		content?: Group[];
		footer?: Group[];
	};
};
export function Sidebar({ children, items }: SidebarProps) {
	const { user } = useSession();
	return (
		<SidebarProvider>
			<SidebarWrapper variant="inset" collapsible="icon">
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton size="lg" asChild>
								<Link href="#">
									<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
										<Command className="size-4" />
									</div>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-semibold">Acme Inc</span>
										<span className="truncate text-xs">Enterprise</span>
									</div>
								</Link>
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
															?.map((e) => e?.[0]?.toUpperCase())
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
																?.map((e) => e?.[0]?.toUpperCase())
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
												onClick={() => toast.promise(logout(), { loading: "logging out..." })}
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
										<Link href={e?.["value"]}>
											{e?.["icon"]}
											<span>{e?.["label"]}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);

						return (
							<Collapsible key={j} asChild>
								<SidebarMenuItem>
									<SidebarMenuButton asChild tooltip={e?.["label"]}>
										<Link href={e?.["value"]}>
											{e?.["icon"]}
											<span>{e?.["label"]}</span>
										</Link>
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
																<Link href={ee?.["value"]}>
																	<span>{ee?.["label"]}</span>
																</Link>
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
