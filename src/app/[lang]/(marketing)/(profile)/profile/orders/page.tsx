"use client";
// import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Image } from "@/components/image";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useCart } from "@/lib/redux";
import { Link } from "@/components/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";

type OrdersProps = Readonly<{ params: Promise<{ "store-id": string } & LocaleProps> }>;
// export const metadata: Metadata = { title: "Orders" };
export default function Orders({ params }: OrdersProps) {
	const cart = useCart();

	return (
		<div className="container py-4">
			<Accordion type="single">
				<AccordionItem value="1">
					<AccordionTrigger>Order #JSKXI1</AccordionTrigger>
					<AccordionContent>
						<Table>
							<TableBody>
								{cart?.["products"]?.map((r, i) => (
									<TableRow key={i} className="[&:not(:nth-child(3))]:border-none">
										<TableCell className="font-medium">
											<Link
												href={`/s/${r?.["product"]?.["storeId"]}/p/${r?.["product"]?.["id"]}`}
												className={cn(
													buttonVariants({
														variant: "link",
													}),
													"h-28 w-full items-start justify-start",
												)}
											>
												<Image
													src={r?.["product"]?.["images"]?.[0]}
													alt={`${r?.["product"]?.["name"]} Image`}
													className="aspect-square size-24 rounded-xl"
												/>
												<div>
													<h1 className="text-lg font-bold">{r?.["product"]?.["name"]}</h1>
													<p className="text-muted-foreground">
														{[
															...r?.["attributes"]?.map((e) =>
																[e?.["name"], e?.["value"]].join(": "),
															),
														].join(", ")}
													</p>
												</div>
											</Link>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex w-fit items-center gap-1 rounded-full border border-primary">
												<Button
													variant="ghost"
													size="icon"
													className="rounded-full"
													onClick={() => {
														cart?.addToCart(r);
													}}
												>
													<Icons.add />
												</Button>
												{r?.["quantity"]}
												<Button
													variant="ghost"
													size="icon"
													className="rounded-full"
													onClick={() => {
														cart?.removeFromCart({ product: r?.["product"] });
													}}
												>
													<Icons.minus />
												</Button>
											</div>
										</TableCell>
										<TableCell>
											<p>${(r?.["product"]?.["price"] * r?.["quantity"]).toFixed(2)}</p>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}
