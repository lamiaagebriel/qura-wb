"use client";

import {
	DataTable,
	DataTableProps,
	DataTableColumnHeader,
	DataTableRowActions,
} from "@/components/_data-table";
import { Product } from "@prisma/client";
import { CardTitle } from "@/components/ui/card";
import { Dictionary } from "@/types/locale";
import { ColumnDef } from "@tanstack/react-table";
import {
	ProductDeleteButton,
	ProductDeleteButtonProps,
} from "@/components/_products/product-delete-button";
import { ProductAttribute } from "@/types/db";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Image } from "@/components/image";
import { cn } from "@/lib/shadcn";
import { LocaleLink } from "../links";

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
							<div className={cn("flex h-28 w-full items-start justify-start gap-2 px-4 py-2")}>
								<Image
									src={r?.["images"]?.[0]}
									alt={`${r?.["name"]} Image`}
									className="aspect-square size-24 rounded-xl"
								/>

								<div className="space-y-2">
									<CardTitle>{r?.["name"]}</CardTitle>

									<Badge
										variant={(() => {
											switch (r?.["status"]) {
												case "ACTIVE":
													return "default";
												case "ARCHIVE":
													return "secondary";
												default:
													return "outline";
											}
										})()}
									>
										{r?.["status"]}
									</Badge>
								</div>
							</div>
						),
						enableSorting: false,
						enableHiding: false,
					},

					{
						accessorKey: "attributes",
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={"Options"} />
						),
						cell: ({ row: { original: r } }) => (
							<div>
								{r?.["attributes"]?.map((e, i) => (
									<div key={i} className="flex items-center gap-1">
										<h1 className="font-medium">{e?.["name"]}: </h1>
										<p className="text-sm text-muted-foreground">{`[${e?.["values"]?.map((x) => x?.["name"])?.join(", ")}]`}</p>
									</div>
								))}
							</div>
						),
						enableSorting: false,
						enableHiding: false,
					},
					{
						accessorKey: "createdAt",
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={c?.["createdAt"]} />
						),
						cell: ({ row: { original: r } }) => (
							<div className="flex items-center gap-2">
								{new Date(r?.["createdAt"]!)?.toLocaleDateString()}
							</div>
						),
						enableSorting: false,
						enableHiding: false,
					},
					{
						id: "actions",
						cell: ({ row: { original: r } }) => {
							return (
								<>
									<DataTableRowActions dic={dic}>
										<LocaleLink href={`/ss/${r?.["storeId"]}/products/${r?.["id"]}`}>
											<DropdownMenuItem className="cursor-pointer">Edit</DropdownMenuItem>
										</LocaleLink>
										<ProductDeleteButton
											dic={dic}
											product={r}
											variant="ghost"
											className="w-full justify-start px-2 text-start font-normal"
										/>
									</DataTableRowActions>
								</>
							);
						},
					},
				] as ColumnDef<ColumnType>[]
			}
		/>
	);
}
