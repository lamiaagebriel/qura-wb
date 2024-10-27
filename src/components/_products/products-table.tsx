"use client";

import {
	DataTable,
	DataTableProps,
	DataTableColumnHeader,
	DataTableRowActions,
} from "@/components/_data-table";
import { Link } from "@/components/link";
import { buttonVariants } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Dictionary } from "@/types/locale";
import { Product } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import {
	ProductDeleteButton,
	ProductDeleteButtonProps,
} from "@/components/_products/product-delete-button";
import {
	ProductUpdateButton,
	ProductUpdateButtonProps,
} from "@/components/_products/product-update-button";
import { ProductAttribute } from "@/types/db";

type ColumnType = Product & {
	attributes: ProductAttribute[];
};
type ProductsTableProps = {
	data: ColumnType[];
} & Pick<DataTableProps<any, any>, "dic"> &
	Pick<ProductUpdateButtonProps, "dic"> &
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
							<DataTableColumnHeader dic={dic} column={column} title={c?.["name"]} />
						),
						cell: ({ row: { original: r } }) => (
							<Link
								href={`/dashboard/s/${r?.["storeId"]}/p/${r?.["id"]}`}
								className={buttonVariants({
									variant: "link",
									className: "flex-col items-start justify-start",
								})}
							>
								<CardTitle>{r?.["name"]}</CardTitle>
							</Link>
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
										<ProductUpdateButton
											dic={dic}
											product={r}
											variant="ghost"
											className="w-full justify-start px-2 text-start font-normal"
										/>
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
