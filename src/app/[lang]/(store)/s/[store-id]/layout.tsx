import { getAuth } from "@/lib/auth";
import { getDictionary } from "@/lib/locale";
import { LocaleProps } from "@/types/locale";

import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/avatar";
import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ModeToggler } from "@/components/mode-toggler";
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
import { db } from "@/lib/db";
import { ShoppingBag } from "lucide-react";
import { Tooltip } from "@/components/tooltip";
import { UserAccountNav } from "@/components/_users/user-account-nav";
import { NavLink } from "@/components/nav-link";
import { Input } from "@/components/ui/input";
import { CartLink } from "@/components/_cart/cart-icon";

type StoreLayoutProps = Readonly<{
	children: React.ReactNode;
	params: Promise<{ "store-id": string } & LocaleProps>;
}>;

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
	const { lang, "store-id": storeId } = await params;
	const { user } = await getAuth();
	const {
		store: { layout: c },
		...dic
	} = await getDictionary(lang);

	const store = await db.store.findUnique({ where: { id: storeId } });
	if (!store) return <>NO STORE</>;

	return (
		<div className="flex min-h-screen flex-col">
			{/* Header */}
			<header className="z-40 bg-background py-2">
				<div className="container grid max-w-screen-2xl grid-cols-3">
					<div className="flex gap-4">
						<Link href={`/s/${storeId}`} className="hidden items-center gap-3 lg:flex">
							<Icons.logo />
							<span>{store?.["name"]}</span>
						</Link>

						{/* Mobile Site Nav lg: */}
						<Drawer>
							<DrawerTrigger asChild>
								<button className="flex items-center gap-2 lg:hidden">
									<Icons.logo />
									<span className="text-sm font-semibold">{c?.["header"]?.["menu"]}</span>
								</button>
							</DrawerTrigger>
							<DrawerContent className="max-h-[95svh]">
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

											<Link href="/profile" className={buttonVariants({})}>
												Profile
											</Link>
										</DrawerHeader>

										<Separator />
									</>
								) : null}

								{c?.["header"]?.["main-nav"]?.["length"] ? (
									<nav>
										<ul className="flex flex-col gap-2 p-4">
											{c?.["header"]?.["main-nav"]?.map((item, i) => (
												<li key={i}>
													<NavLink
														href={`/s/${storeId}${item?.["value"]}`}
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
									<Link
										href={`/s/${storeId}`}
										className="inline-flex items-center gap-2 font-bold tracking-wide"
									>
										<Icons.logo />
										<span>{store?.["name"]}</span>
									</Link>

									<div>
										<LocaleSwitcher dic={dic} />
										<ModeToggler dic={dic} />
									</div>
								</DrawerFooter>
							</DrawerContent>
						</Drawer>
					</div>

					<div className="flex items-center">
						<div className="flex w-full items-center gap-1 rounded-full border bg-muted px-4 text-muted-foreground">
							<Icons.search />
							<Input
								placeholder="Search..."
								className="w-full border-none shadow-none outline-none focus-visible:ring-0"
							/>
						</div>
					</div>

					<div className="flex items-center justify-end gap-6">
						<div>
							{c?.["header"]?.["main-nav"]?.["length"] ? (
								<nav className="hidden lg:block">
									<ul className="flex items-center justify-start gap-2 text-sm">
										{c?.["header"]?.["main-nav"]?.map((item, i) => (
											<li key={i}>
												<NavLink
													href={`/s/${storeId}${item?.["value"]}`}
													disabled={item?.["disabled"]}
													segments={item?.["segments"]}
													className={cn(
														buttonVariants({ variant: "ghost" }),
														"text-muted-foreground",
													)}
													// className={cn(buttonVariants({ variant: "link" }))}
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

						<div className="flex items-center justify-center gap-2">
							<CartLink href={`/s/${storeId}/cart`} />
							{user ? (
								<Tooltip tip={user?.["name"]}>
									<div className="mt-1.5">
										<UserAccountNav dic={dic} items={[]} />
									</div>
								</Tooltip>
							) : (
								<>
									<Link
										href="/login"
										className={buttonVariants({
											variant: "link",
											className: "gap-2 px-4",
										})}
									>
										{c?.["header"]?.["login"]}
										<Avatar user={null} className="h-5 w-5 border" />
									</Link>
								</>
							)}
						</div>
					</div>
				</div>
			</header>

			<main className="flex-1">{children}</main>

			{/* Footer */}
			<footer className="mt-10 border-t bg-secondary py-8">
				<div className="container">
					<div className="grid gap-8 sm:grid-cols-2 md:grid-cols-[1fr,1fr,1fr]">
						<div className="flex flex-col items-center space-y-4 md:items-start">
							<div className="flex items-start gap-2 font-bold">
								<Icons.logo />
								<p className="text-main">{store?.["name"]}</p>
							</div>
							<p className="max-w-prose text-center text-xs text-muted-foreground md:text-start">
								{/* {store?.["description"]} */}
								Lorem ipsum dolor sit amet consectetur adipisicing elit. Fugit a, natus libero
								cupiditate facere ratione temporibus. Doloremque, asperiores, voluptatem tempora
								repudiandae esse deserunt animi dignissimos veritatis, illo voluptatibus autem
								eaque.
							</p>
							<div className="flex items-center gap-1">
								<Button variant="outline" size="icon" className="rounded-full">
									<Icons.facebook />
								</Button>
								<Button variant="outline" size="icon" className="rounded-full">
									<Icons.instagram />
								</Button>
								<Button variant="outline" size="icon" className="rounded-full">
									<Icons.twitter />
								</Button>
								{/* <Button variant="outline" size="icon" className="rounded-full">
									<Icons.telegram />
								</Button> */}
							</div>
						</div>

						<div className="flex items-start justify-center gap-10 sm:justify-end">
							{c?.["footer"]?.["main-nav"].map((e, i) => (
								<div key={i} className="space-y-4">
									<h2 className="whitespace-nowrap font-bold">
										{e?.["label"] === "store-name" ? store?.["name"] : e?.["label"]}
									</h2>
									<div className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
										{e?.["items"].map((item, j) => (
											<Link
												key={i}
												href={`/s/${storeId}${item?.["value"]}`}
												disabled={item?.["disabled"]}
												className={buttonVariants({
													variant: "link",
													className: "h-auto p-0",
												})}
											>
												{item?.["label"]}
											</Link>
										))}
									</div>
								</div>
							))}
						</div>

						<div className="space-y-4 sm:col-span-2 md:col-span-1">
							<h2 className="text-center font-bold">{c?.["footer"]?.["download app now"]}</h2>
							<div className="flex flex-wrap items-center justify-center gap-2">
								<Link
									href={`/s/${storeId}`}
									dir="ltr"
									className={buttonVariants({
										size: "lg",
										className: "rounded-full py-6",
									})}
								>
									<>
										<p className="text-left">
											<span className="text-xs text-muted-foreground">
												{c?.["footer"]?.["download on the"]}
											</span>
											<br />
											App Store
										</p>

										<Icons.googlePlay className="h-6 w-6" />
									</>
								</Link>

								<Link
									href={`/s/${storeId}`}
									dir="ltr"
									className={buttonVariants({
										size: "lg",
										className: "rounded-full py-6",
									})}
								>
									<>
										<p className="text-left">
											<span className="text-xs text-muted-foreground">
												{c?.["footer"]?.["get it on"]}
											</span>
											<br />
											Google Play
										</p>

										<Icons.googlePlay className="h-6 w-6" />
									</>
								</Link>
							</div>
						</div>
					</div>

					<Separator className="mb-5 mt-16" />
					<div className="flex flex-col items-center justify-between gap-2 lg:flex-row">
						<p>
							{store?.["name"]} {c?.["footer"]?.["copyright ©"]} {new Date().getFullYear()}
						</p>

						<div className="flex flex-wrap items-center justify-center gap-4">
							<div>
								<ModeToggler dic={dic} />
								<LocaleSwitcher dic={dic} />
							</div>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
