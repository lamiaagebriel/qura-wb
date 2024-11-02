"use client";

import {
	DataTable,
	DataTableProps,
	DataTableColumnHeader,
	DataTableRowActions,
} from "@/components/_data-table";
import { Link } from "@/components/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Dictionary } from "@/types/locale";
import { Product } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import {
	ProductDeleteButton,
	ProductDeleteButtonProps,
} from "@/components/_products/product-delete-button";
import { ProductAttribute } from "@/types/db";
import { Image } from "@/components/image";
import { cn } from "@/lib/utils";
import { Icons } from "../icons";

type ColumnType = Product & {
	attributes: ProductAttribute[];
};
type ProductsTableProps = {
	data: ColumnType[];
} & Pick<DataTableProps<any, any>, "dic"> &
	Pick<ProductDeleteButtonProps, "dic"> &
	Dictionary["products-table"];

export function ProductsTable({ dic: { "products-table": c, ...dic }, data }: ProductsTableProps) {
	return (
		<DataTable
			dic={dic}
			data={data}
			columns={
				[
					{
						accessorKey: "name",
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={"Product Code"} />
						),
						cell: ({ row: { original: r } }) => (
							<Link
								href={`/s/${r?.["storeId"]}/p/${r?.["id"]}`}
								className={cn(
									buttonVariants({
										variant: "link",
									}),
									"h-28 w-full items-start justify-start",
								)}
							>
								<Image
									src={r?.["images"]?.[0]}
									alt={`${r?.["name"]} Image`}
									className="aspect-square size-24 rounded-xl"
								/>
								<div>
									<h1 className="text-lg font-bold">{r?.["name"]}</h1>
									<p className="text-muted-foreground">
										{[
											...r?.["attributes"]?.map((e) =>
												[e?.["name"], e?.["values"]?.[0]?.["name"]].join(": "),
											),
										].join(", ")}
									</p>
								</div>
							</Link>
						),
						enableSorting: false,
						enableHiding: false,
					},
					{
						accessorKey: "stock",
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={"Quantity"} />
						),
						cell: ({ row: { original: r } }) => (
							<div className="flex w-fit items-center gap-1 rounded-full border border-primary">
								<Button variant="ghost" size="icon" className="rounded-full">
									<Icons.add />
								</Button>
								{r?.["stock"]}
								<Button variant="ghost" size="icon" className="rounded-full">
									<Icons.minus />
								</Button>
							</div>
						),
						enableSorting: false,
						enableHiding: false,
					},
					{
						accessorKey: "price",
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={"Total Price"} />
						),
						cell: ({ row: { original: r } }) => <p>${r?.["price"]}.5</p>,
						enableSorting: false,
						enableHiding: false,
					},
					{
						id: "actions",
						cell: ({ row: { original: r } }) => {
							return (
								<ProductDeleteButton dic={dic} product={r} variant="destructive" size="icon" />
							);
						},
					},
				] as ColumnDef<ColumnType>[]
			}
		/>
	);
}
