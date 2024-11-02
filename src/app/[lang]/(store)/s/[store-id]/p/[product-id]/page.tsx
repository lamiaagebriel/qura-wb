import type { Metadata } from "next";
import { db } from "@/lib/db";
import { LocaleProps } from "@/types/locale";
import { Link } from "@/components/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Image } from "@/components/image";
import { Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductAttribute } from "@/types/db";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Discord } from "arctic";
import { SelectItem } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { Progress } from "@/components/ui/progress";
import { ProductCard } from "@/components/_products/product-card";

type ProductProps = Readonly<{
	params: Promise<{ "store-id": string; "product-id": string } & LocaleProps>;
}>;
export const metadata: Metadata = { title: "Product" };
export default async function Product({ params }: ProductProps) {
	const { lang, "store-id": storeId, "product-id": productId } = await params;
	const rs = await db.product.findMany({
		where: { storeId },
	});
	const r = await db.product.findUnique({
		where: { id: productId, storeId },
	});

	if (!r) return <>NO PRODUCT</>;
	const product = { ...r, attributes: r?.["attributes"] as ProductAttribute[] };
	const products = rs?.map((e) => ({ ...e, attributes: e?.["attributes"] as ProductAttribute[] }));

	return (
		<div className="container space-y-4 py-4">
			<div className="flex items-center">
				<Link
					href={`/s/${product?.["storeId"]}`}
					className={cn(
						buttonVariants({
							variant: "ghost",
							// size: "icon",
						}),
					)}
				>
					<Icons.arrowLeft />
					Home
				</Link>

				<div className="flex items-center gap-4 text-muted-foreground">
					<Icons.dot />
					<p>Product Details</p>
				</div>
			</div>

			<div className="space-y-16">
				<div className="grid gap-4 overflow-hidden lg:grid-cols-2 lg:gap-10">
					<div>
						<Tabs defaultValue="0" className="flex flex-row items-start gap-2 space-y-0">
							<TabsList className="h-fit max-w-24 flex-col gap-2">
								{product?.["images"]?.map((e, i) => (
									<TabsTrigger key={i} value={i?.toString()} className="p-0.5">
										<Image
											priority={true}
											src={e}
											alt={`${product?.["name"]}`}
											className="aspect-square"
										/>
									</TabsTrigger>
								))}
							</TabsList>

							{product?.["images"]?.map((e, i) => (
								<TabsContent key={i} value={i?.toString()} className="relative">
									{/* <div className="absolute left-0 top-0 flex h-12 w-full items-start gap-2 bg-gradient-to-b from-black to-transparent p-2">
										{product?.["images"]?.map((e, i) => (
											<div key={i} className={cn("h-1 w-full rounded-md bg-white")} />
										))}
									</div> */}
									<Image
										priority={true}
										src={e}
										alt={`${product?.["name"]}`}
										className="aspect-square"
									/>
								</TabsContent>
							))}
						</Tabs>
					</div>

					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h1 className="text-4xl font-semibold">{product?.["name"]}</h1>
							<p className="text-xl font-bold">${product?.["price"]}.05</p>
						</div>

						{product?.["attributes"]?.map((e, i) => (
							<div key={i} className="space-y-1">
								<h1 className="text-sm text-muted-foreground">Select {e?.["name"]}</h1>
								<RadioGroup defaultValue={`${i}-0`} className="flex items-center gap-2">
									{e?.["values"]?.map((v, j) => (
										<div key={`${i}-${j}`}>
											<RadioGroupItem
												value={`${i}-${j}`}
												id={`${i}-${j}`}
												className="peer sr-only"
											/>

											<Label
												htmlFor={`${i}-${j}`}
												className="flex cursor-pointer items-center rounded-full border border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground [&:has([data-state=checked])]:border-primary"
											>
												{v?.["name"]}
											</Label>
										</div>
									))}
								</RadioGroup>
							</div>
						))}

						<div className="flex items-center gap-2">
							<Button className="w-full rounded-full py-4">Add to Cart</Button>
							<Button variant="outline" size="icon" className="rounded-full">
								<Icons.heart />
							</Button>
						</div>
						<Accordion type="single" defaultValue="shopping" collapsible>
							<AccordionItem value="description">
								<AccordionTrigger>Description & Fit</AccordionTrigger>
								<AccordionContent>
									Lorem ipsum dolor sit amet consectetur, adipisicing elit. Fugit tempore esse odit
									eius at iure assumenda atque officiis tenetur. At, nobis quasi ullam iusto commodi
									ducimus similique maiores error placeat. Lorem, ipsum dolor sit amet consectetur
									adipisicing elit. Quia error aut porro eligendi minus aliquid quaerat sequi non
									nemo minima, ducimus, vel ullam vitae tempore assumenda tempora quibusdam eum
									provident. Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quidem
									excepturi est architecto veniam? Iure ab illum, ipsum nisi maiores explicabo eos
									nemo voluptatum? Quisquam ipsa architecto excepturi alias ab magnam!
									<br />
									<br />
									Lorem ipsum dolor sit amet consectetur, adipisicing elit. Fugit tempore esse odit
									eius at iure assumenda atque officiis tenetur. At, nobis quasi ullam iusto commodi
									ducimus similique maiores error placeat. Lorem, ipsum dolor sit amet consectetur
									adipisicing elit. Quia error aut porro eligendi minus aliquid quaerat sequi non
									nemo minima, ducimus, vel ullam vitae tempore assumenda tempora quibusdam eum
									provident. Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quidem
									excepturi est architecto veniam? Iure ab illum, ipsum nisi maiores explicabo eos
									nemo voluptatum? Quisquam ipsa architecto excepturi alias ab magnam!
								</AccordionContent>
							</AccordionItem>

							<AccordionItem value="shopping">
								<AccordionTrigger>Shopping</AccordionTrigger>
								<AccordionContent>
									<div className="grid grid-cols-2 gap-4">
										{(
											[
												{
													value: "discount",
													label: "Discount",
													icon: "percent",
													children: "Disc 50%",
												},
												{
													value: "Package",
													label: "package",
													icon: "package",
													children: "Regular Package",
												},
												{
													value: "delivery-time",
													label: "Delivery Time",
													icon: "calender",
													children: "3-4 Working Days",
												},
												{
													value: "estimated-arrival",
													label: "Estimated Arrival",
													icon: "truck",
													children: "10-12 Oct. 2024",
												},
											] as SelectItem[]
										).map((e, i) => {
											const Icon = e?.["icon"] ? Icons[e?.["icon"]] : null;

											return (
												<div key={i} className="flex items-center gap-2">
													<div className="rounded-full bg-muted p-4">
														<Button size="icon" className="rounded-full">
															{Icon && <Icon />}
														</Button>
													</div>
													<div>
														<h1 className="text-sm text-muted-foreground">{e?.["label"]}</h1>
														{e?.["children"]}
													</div>
												</div>
											);
										})}
									</div>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					</div>
				</div>

				<div>
					<h1>Rating & Reviews</h1>

					<div className="grid gap-4 overflow-hidden lg:grid-cols-2 lg:gap-10">
						<div className="grid grid-cols-2 items-center gap-1">
							<div>
								<p className="text-[5rem] font-bold">
									4.5<span className="text-base font-normal text-muted-foreground">/5</span>
								</p>
								<p className="text-sm text-muted-foreground">(50 new reviews)</p>
							</div>

							<div>
								{Array.from({ length: 5 }).map((e, i) => (
									<div key={i} className="flex items-center gap-1">
										<Icons.star className="fill-yellow-400 text-yellow-400" />
										{5 - i}
										<Progress value={70 - i * 15} />
									</div>
								))}
							</div>
						</div>

						<Card>
							<CardHeader className="flex flex-row justify-between gap-2">
								<div className="flex items-center gap-2">
									<Avatar user={{ name: "", image: null }} />
									<div className="space-y-1">
										<CardTitle>Alex Mathio</CardTitle>
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-1">
												<Icons.star className="fill-yellow-400 text-yellow-400" />
												<Icons.star className="fill-yellow-400 text-yellow-400" />
												<Icons.star className="fill-yellow-400 text-yellow-400" />
												<Icons.star className="fill-yellow-400 text-yellow-400" />
												<Icons.star className="fill-yellow-400 text-yellow-400" />
											</div>
										</div>
									</div>
								</div>

								<div>
									<p className="text-sm text-muted-foreground">
										{new Intl.DateTimeFormat("en-GB", {
											day: "2-digit",
											month: "short",
											year: "numeric",
										}).format(new Date())}
									</p>
								</div>
							</CardHeader>
							<CardContent>
								<CardDescription>
									&quot;Lorem ipsum dolor sit amet consectetur adipisicing elit. Ab quae inventore
									blanditiis atque eveniet consequatur quidem! Repudiandae laborum repellendus
									ducimus explicabo repellat vel temporibus officia. Fugit nulla excepturi fugiat
									incidunt?&quot;
								</CardDescription>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
			{/* May Like */}

			<div className="mt-16">
				<h1>You maight also like: </h1>

				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-10">
					{products?.map((e, i) => <ProductCard key={i} product={e} />)}
				</div>
			</div>
		</div>
	);
}
