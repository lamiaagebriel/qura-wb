"use client";

import { useSelectedLayoutSegment } from "next/navigation";

import { NavItem } from "@/types";

import { cn } from "@/lib/utils";
import { Dictionary } from "@/types/locale";

import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { LocaleSwitcher, LocaleSwitcherProps } from "@/components/locale-switcher";
import { ModeToggler, ModeTogglerProps } from "@/components/mode-toggler";

import { Avatar } from "./avatar";
import { useSession } from "./session-provider";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "./ui/drawer";
import { Separator } from "./ui/separator";

type SiteNavProps = {
	items: NavItem[];
	children?: React.ReactNode;
} & Dictionary["site"] &
	Dictionary["site-nav"] &
	Pick<ModeTogglerProps, "dic"> &
	Pick<LocaleSwitcherProps, "dic">;

export function SiteNav({ dic: { site, "site-nav": c, ...dic }, items, children }: SiteNavProps) {
	const { user } = useSession();
	const segment = useSelectedLayoutSegment();

	return (
		<header className="z-40 border-b bg-background py-2">
			<div className="container flex max-w-screen-2xl items-center justify-between">
				<div className="flex gap-4">
					<Link href="/" className="hidden items-center lg:flex">
						<Icons.logo />
						<span className="sr-only">{site?.["name"]}</span>
					</Link>

					{items?.["length"] ? (
						<nav className="hidden lg:block">
							<ul className="flex items-center justify-start gap-2 text-sm">
								{items.map((item, i) => (
									<li key={i}>
										<Link
											href={item?.["value"]}
											disabled={item?.["disabled"]}
											className={buttonVariants({
												variant: "ghost",
												className: cn(
													"text-muted-foreground",
													// item?.["value"].startsWith(`/${segment}`) ||
													//   (item?.["value"] === `/` && !segment)

													segment === item?.["segment"] ||
														item?.["segment"]?.some((e) => segment === e)
														? "border-foreground text-primary underline underline-offset-[21px]"
														: "",
												),
											})}
										>
											{item?.["label"]}
										</Link>
									</li>
								))}
							</ul>
						</nav>
					) : null}

					{/* Mobile Site Nav :md */}

					<Drawer>
						<DrawerTrigger asChild>
							<button className="flex items-center gap-2 lg:hidden">
								{/* {showMobileMenu ? <Icons.close /> : <Icons.logo />}   */}
								<Icons.logo />
								<span className="text-sm font-semibold">{c?.["menu"]}</span>
							</button>
						</DrawerTrigger>
						<DrawerContent className="max-h-[95vh]">
							{user ? (
								<>
									<DrawerHeader className="flex items-center justify-between gap-4">
										<div className="flex items-center justify-start gap-2">
											<Avatar user={user} />
											<div className="flex flex-col items-start">
												<DrawerTitle>{user?.["name"]}</DrawerTitle>
												<DrawerDescription className="text-xs">{user?.["email"]}</DrawerDescription>
											</div>
										</div>
										{/* {userNav?.[0] && (
											<Link href={userNav?.[0]?.["value"]} className={buttonVariants({})}>
												{userNav?.[0]?.["label"]}
											</Link>
										)} */}
									</DrawerHeader>

									<Separator />
								</>
							) : null}

							{items?.["length"] ? (
								<nav>
									<ul className="flex flex-col gap-2 p-4">
										{items.map((item, i) => (
											<li key={i}>
												<Link
													href={item?.["value"]}
													disabled={item?.["disabled"]}
													className={buttonVariants({
														variant: "secondary",
														className: cn(
															"w-full text-muted-foreground",
															item?.["value"].startsWith(`/${segment}`) ||
																(item?.["value"] === `/` && !segment)
																? "text-foreground"
																: "",
														),
													})}
												>
													{item?.["label"]}
												</Link>
											</li>
										))}
									</ul>
								</nav>
							) : null}

							<DrawerFooter className="flex flex-row items-center justify-between">
								<Link href="/" className="inline-flex items-center gap-2 font-bold tracking-wide">
									<Icons.logo />
									<span>{site?.["name"]}</span>
								</Link>

								<div>
									<LocaleSwitcher dic={dic} />
									<ModeToggler dic={dic} />
								</div>
							</DrawerFooter>
						</DrawerContent>
					</Drawer>
				</div>

				{children}
			</div>
		</header>
	);
}
