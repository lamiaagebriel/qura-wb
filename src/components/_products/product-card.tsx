"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";

import { Product } from "@prisma/client";
import { ProductAttribute } from "@/types/db";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tooltip } from "../tooltip";
import { Link } from "../link";
import { Image } from "../image";
import { useCart } from "@/lib/redux";
import {
	AlertDialogAction,
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "../ui/alert-dialog";
import { ProductDetailsCartButton } from "./product-details-cart-button";

export type ProductCardProps = {
	product: Product & { attributes: ProductAttribute[] };
};
// & Dictionary["product-card"]
// & Pick<ProductFormProps, "dic">;

export function ProductCard({
	// dic: { "product-card": c, ...dic },
	product,
}: ProductCardProps) {
	const cart = useCart();

	return (
		<Card className="border-none shadow-none outline-none">
			<CardHeader className="relative border-none p-0 outline-none">
				<Link href={`/s/${product?.["storeId"]}/p/${product?.["id"]}`}>
					<Image
						src={product?.["images"]?.[0]}
						alt={`${product?.["name"]}`}
						className="aspect-[9/12] border-none"
					/>
				</Link>

				<div className="absolute bottom-0 right-0 z-10 rounded-tl-xl bg-background pl-[6px] pt-[6px]">
					<div className="absolute right-0 top-0 size-4 -translate-y-[calc(100%-6px+0.5px)] translate-x-[calc(6px-0.5px)] rounded-br-xl border-[6px] border-l-0 border-t-0 border-background" />
					<div className="absolute bottom-0 left-0 size-4 -translate-x-[calc(100%-6px+0.5px)] translate-y-[calc(6px-0.5px)] rounded-br-xl border-[6px] border-l-0 border-t-0 border-background" />
					<ProductDetailsCartButton product={product}>
						<div>
							<Tooltip tip="add to cart">
								<Button size="icon">
									<Icons.shoppingBasket />
								</Button>
							</Tooltip>
						</div>
					</ProductDetailsCartButton>

					{/* <AlertDialog>
						<AlertDialogTrigger asChild>
						 
						</AlertDialogTrigger>
						<AlertDialogContent> 
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={() => {
										cart.addToCart({
											product: {
												id: product?.["id"],
												storeId: product?.["storeId"],
												price: product?.["price"],
												name: product?.["name"],
												images: product?.["images"],
												stock: product?.["stock"],
											},
											attributes: product?.["attributes"]?.map((e) => ({
												name: e?.["name"],
												value: e?.["values"]?.[0]?.["name"],
											})),
											quantity: 1,
										});
									}}
								>
									Continue
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog> */}
				</div>
			</CardHeader>

			<Link href={`/s/${product?.["storeId"]}/p/${product?.["id"]}`}>
				<CardContent className="space-y-1 p-0 pt-4">
					<CardTitle>{product?.["name"]}</CardTitle>
					<CardTitle>${product?.price}</CardTitle>
				</CardContent>
			</Link>
		</Card>
	);
}
