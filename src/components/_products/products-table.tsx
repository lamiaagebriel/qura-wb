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
import { LocaleLink } from "@/components/links";
import { productStatus } from "@/constants/enums";
import { useLocale } from "@/hooks/use-locale";

type ColumnType = Product & {
	attributes: ProductAttribute[];
};
type ProductsTableProps = {
	data: ColumnType[];
} & Pick<DataTableProps<any, any>, "dic"> &
	Pick<ProductDeleteButtonProps, "dic"> &
	Dictionary["products-table"];

export function ProductsTable({ dic: { "products-table": c, ...dic }, data }: ProductsTableProps) {
	const locale = useLocale();

	return (
		<DataTable
			dic={dic}
			data={data}
			columns={
				[
					{
						accessorKey: "images",
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={c?.["product image"]} />
						),
						cell: ({ row: { original: r } }) => (
							<div className={cn("h-28 p-2")}>
								<Image
									src={r?.["images"]?.[0]}
									alt={`${r?.["name"]} Image`}
									className="aspect-square size-24 rounded-xl"
								/>
							</div>
						),
						enableSorting: false,
						enableHiding: false,
					},
					{
						accessorKey: "name",
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={c?.["product details"]} />
						),
						cell: ({ row: { original: r } }) => (
							<div className="w-full">
								<div className="space-y-2">
									<div className="flex items-start gap-2">
										<div>
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
												{
													productStatus({ locale })?.find((e) => e?.["value"] === r?.["status"])?.[
														"label"
													]
												}
											</Badge>
										</div>

										<h1 className="font-medium">{r?.["name"]}</h1>
									</div>
								</div>
							</div>
						),
						enableSorting: false,
						enableHiding: false,
					},
					{
						accessorKey: "price",
						enableSorting: false,
						enableHiding: false,
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={c?.["price"]} />
						),
						cell: ({ row: { original: r } }) => (
							<div>
								<span
									className={cn(
										r?.["discount"] && r?.["discount"] > 0 && "text-destructive line-through",
									)}
								>
									{r?.["price"]}$
								</span>
								{r?.["discount"] && r?.["discount"] > 0 ? (
									<>
										{" "}
										- <span className="font-medium">{r?.["discount"]}$</span>
									</>
								) : null}
							</div>
						),
					},
					{
						accessorKey: "stock",
						enableSorting: false,
						enableHiding: false,
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={c?.["stock"]} />
						),
						cell: ({ row: { original: r } }) => (
							<div>
								{r?.["stock"]} {c?.["unit(s)"]}
							</div>
						),
					},
					{
						accessorKey: "attributes",
						enableSorting: false,
						enableHiding: false,
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={c?.["options"]} />
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
					},
					{
						accessorKey: "createdAt",
						enableSorting: false,
						enableHiding: false,
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={c?.["createdAt"]} />
						),
						cell: ({ row: { original: r } }) => (
							<div className="flex items-center gap-2">
								{new Date(r?.["createdAt"]!)?.toLocaleDateString()}
							</div>
						),
					},
					{
						id: "actions",
						cell: ({ row: { original: r } }) => {
							return (
								<>
									<DataTableRowActions dic={dic}>
										<LocaleLink href={`/ss/${r?.["storeId"]}/products/${r?.["id"]}`}>
											<DropdownMenuItem className="cursor-pointer">{c?.["edit"]}</DropdownMenuItem>
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
