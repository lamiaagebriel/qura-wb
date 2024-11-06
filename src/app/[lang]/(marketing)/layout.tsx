import { getAuth } from "@/lib/auth";
import { getDictionary } from "@/lib/locale";
import { LocaleProps } from "@/types/locale";

import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/avatar";
import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ModeToggler } from "@/components/mode-toggler";
import { UserAccountNav } from "@/components/_users/user-account-nav";
import { NavLink } from "@/components/nav-link";
import { cn } from "@/lib/utils";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";

type MarketingLayoutProps = Readonly<{
	children: React.ReactNode;
	params: Promise<LocaleProps>;
}>;

export default async function MarketingLayout({ children, params }: MarketingLayoutProps) {
	const { lang } = await params;
	const { user } = await getAuth();
	const {
		site,
		marketing: { "main-nav": mainNav, layout: c },
		...dic
	} = await getDictionary(lang);
	const navs = [
		{ segments: null, value: "/profile", label: "Profile" },
		{ segments: ["orders"], value: "/profile/orders", label: "Orders" },
		{ segments: ["settings"], value: "/profile/settings", label: "Settings", disabled: true },
	];

	return (
		<div className="flex min-h-screen flex-col">
			<div className="container flex flex-col items-center justify-between gap-2 py-2 sm:flex-row">
				<div className="flex items-center gap-2">
					<ModeToggler dic={dic} />
					<LocaleSwitcher dic={dic} />

					<Button variant="ghost" size="icon" className="rounded-full">
						<Icons.search />
					</Button>
				</div>
			</div>

			{/* Header */}
			<header className="z-40 border-b bg-background py-2">
				<div className="container flex max-w-screen-2xl items-center justify-between">
					<div className="flex gap-4">
						<Link href="/" className="hidden items-center lg:flex">
							<Icons.logo />
							<span className="sr-only">{site?.["name"]}</span>
						</Link>

						{mainNav?.["length"] ? (
							<nav className="hidden lg:block">
								<ul className="flex items-center justify-start gap-2 text-sm">
									{mainNav.map((item, i) => (
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

						{/* Mobile Site Nav :md */}
						<Drawer>
							<DrawerTrigger asChild>
								<button className="flex items-center gap-2 lg:hidden">
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
													<DrawerDescription className="text-xs">
														{user?.["email"]}
													</DrawerDescription>
												</div>
											</div>
											{navs?.[1] && (
												<Link href={navs?.[1]?.["value"]} className={buttonVariants({})}>
													{navs?.[1]?.["label"]}
												</Link>
											)}
										</DrawerHeader>

										<Separator />
									</>
								) : null}

								{mainNav?.["length"] ? (
									<nav>
										<ul className="flex flex-col gap-2 p-4">
											{mainNav.map((item, i) => (
												<li key={i}>
													<NavLink
														href={item?.["value"]}
														disabled={item?.["disabled"]}
														segments={item?.["segments"]}
														className={cn(
															buttonVariants({ variant: "secondary" }),
															"w-full text-muted-foreground",
														)}
														activeClassNames="text-foreground"
													>
														{item?.["label"]}
													</NavLink>
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

					{user ? (
						<UserAccountNav dic={dic} items={navs} />
					) : (
						<>
							<Link
								href="/login"
								className={buttonVariants({
									variant: "link",
									className: "gap-2 px-4",
								})}
							>
								{c?.["login"]}
								<Avatar user={null} className="h-5 w-5 border" />
							</Link>
						</>
					)}
				</div>
			</header>

			<main className="flex flex-1 flex-col">{children}</main>
		</div>
	);
}
