"use client";

import {
	DataTable,
	DataTableProps,
	DataTableColumnHeader,
	DataTableRowActions,
} from "@/components/_data-table";
import { Order } from "@prisma/client";
import { Dictionary } from "@/types/locale";
import { ColumnDef } from "@tanstack/react-table";
import {
	OrderDeleteButton,
	OrderDeleteButtonProps,
} from "@/components/_orders/order-delete-button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/shadcn";
import { LocaleLink } from "../links";

type ColumnType = Order;
type OrdersTableProps = {
	data: ColumnType[];
} & Pick<DataTableProps<any, any>, "dic"> &
	Pick<OrderDeleteButtonProps, "dic"> &
	Dictionary["orders-table"];

export function OrdersTable({ dic: { "orders-table": c, ...dic }, data }: OrdersTableProps) {
	return (
		<DataTable
			dic={dic}
			data={data}
			columns={
				[
					{
						accessorKey: "details",
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={"Order Code"} />
						),
						cell: ({ row: { original: r } }) => (
							<div className={cn("flex h-28 w-full items-start justify-start gap-2 px-4 py-2")}>
								{r?.["details"]?.["products"]?.["length"]}
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
								{r?.["details"]?.["products"]?.["0"]?.["attributes"]?.map((e, i) => (
									<div key={i} className="flex items-center gap-1">
										<h1 className="font-medium">{e?.["name"]}: </h1>
										<p className="text-sm text-muted-foreground">{`[${e?.["value"]}]`}</p>
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
										<LocaleLink href={`/ss/${r?.["storeId"]}/orders/${r?.["id"]}`}>
											<DropdownMenuItem className="cursor-pointer">Edit</DropdownMenuItem>
										</LocaleLink>
										<OrderDeleteButton
											dic={dic}
											order={r}
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
