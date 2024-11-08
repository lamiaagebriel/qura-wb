import type { Metadata } from "next";
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
import { db } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { $Enums } from "@prisma/client";

type OrdersProps = Readonly<{ params: Promise<{ "store-id": string } & LocaleProps> }>;
export const metadata: Metadata = { title: "Orders" };
export default async function Orders({ params }: OrdersProps) {
	const { user } = await getAuth();
	const orders = await db.order.findMany({ where: { userId: user?.["id"] ?? "" } });
	const products = await db.product.findMany({
		where: {
			id: {
				in: orders
					?.map((e) => (e?.["details"] as any)?.["products"]?.map((x: any) => x?.["productId"]))
					.flat(),
			},
		},
	});

	return (
		<div className="container py-4">
			<Accordion type="single">
				{orders?.map((e, i) => (
					<AccordionItem key={e?.["id"]} value={e?.["id"]}>
						<AccordionTrigger>
							<div>
								Order #{e?.["id"]} - <Badge>{e?.["status"]}</Badge>
							</div>
						</AccordionTrigger>
						<AccordionContent>
							<Table>
								<TableBody>
									{(e?.["details"] as any)?.["products"]?.map((p: any, i: any) => (
										<TableRow key={i} className="[&:not(:nth-child(3))]:border-none">
											<TableCell className="font-medium">
												<Link
													href={`/s/${e?.["storeId"]}/p/${p?.["productId"]}`}
													className={cn(
														buttonVariants({
															variant: "link",
														}),
														"h-28 w-full items-start justify-start",
													)}
												>
													<Image
														src={
															products?.find((z) => z?.["id"] === p?.["productId"])?.[
																"images"
															]?.[0]!
														}
														alt={`${products?.find((z) => z?.["id"] === p?.["productId"])?.["name"]} Image`}
														className="aspect-square size-24 rounded-xl"
													/>
													<div>
														<h1 className="text-lg font-bold">
															{products?.find((z) => z?.["id"] === p?.["productId"])?.["name"]}
														</h1>
														<p className="text-muted-foreground">
															{[
																...p?.["attributes"]?.map((e: any) =>
																	[e?.["name"], e?.["value"]].join(": "),
																),
															].join(", ")}
														</p>
													</div>
												</Link>
											</TableCell>
											<TableCell className="text-right">
												<div className={cn(buttonVariants({ variant: "outline" }))}>
													{p?.["quantity"]} pieces
												</div>
											</TableCell>
											<TableCell>
												<p>${(p?.["price"] * p?.["quantity"]).toFixed(2)}</p>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</div>
	);
}
