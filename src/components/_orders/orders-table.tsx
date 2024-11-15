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
import { Badge } from "@/components/ui/badge";
import { LocaleLink } from "@/components/links";
import { orderStatus } from "@/constants/enums";
import { useLocale } from "@/hooks/use-locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";

type ColumnType = Order;
type OrdersTableProps = {
	data: ColumnType[];
	order: any;
} & Pick<DataTableProps<any, any>, "dic"> &
	Pick<OrderDeleteButtonProps, "dic"> &
	Dictionary["orders-table"];

export function OrdersTable({ dic: { "orders-table": c, ...dic }, data, order }: OrdersTableProps) {
	const locale = useLocale();

	return (
		<DataTable
			dic={dic}
			data={data}
			columns={
				[
					{
						accessorKey: "id",
						enableSorting: false,
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={c?.["order"]} />
						),
						cell: ({ row: { original: r } }) => (
							<div className="flex w-full items-center justify-center">
								<div className="flex items-start gap-2">
									<div>
										<Badge
											variant={(() => {
												switch (r?.["status"]) {
													case "CONFIRMED":
														return "default";
													case "DELIVERYED":
														return "secondary";
													default:
														return "outline";
												}
											})()}
										>
											{
												orderStatus({ locale })?.find((e) => e?.["value"] === r?.["status"])?.[
													"label"
												]
											}
										</Badge>
									</div>

									<h1 className="font-medium">#{r?.["id"]?.slice(0, 6)}</h1>
								</div>
							</div>
						),
					},
					{
						accessorKey: "id",
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={c?.["customer"]} />
						),
						cell: ({ row: { original: r } }) => (
							<div className="flex items-center justify-center">
								<div className="flex items-center gap-2">
									<Avatar>
										<AvatarImage src={order?.["customer"]?.["image"]!} alt="" />
										<AvatarFallback text={order?.["customer"]?.["name"]!}>
											<Icons.user />
										</AvatarFallback>
									</Avatar>
									<div>
										<h2>{order?.["customer"]?.["name"]}</h2>
										<p className="text-xs text-muted-foreground">
											{order?.["customer"]?.["email"]}
										</p>
									</div>
								</div>
							</div>
						),
					},
					{
						accessorKey: "id",
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={c?.["total"]} />
						),
						cell: ({ row: { original: r } }) => (
							<div className="flex items-center justify-center">
								<p>${10}</p>
							</div>
						),
					},
					{
						accessorKey: "id",
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={c?.["products"]} />
						),
						cell: ({ row: { original: r } }) => (
							<div className="flex items-center justify-center">
								<p>{3}</p>
							</div>
						),
					},
					{
						accessorKey: "id",
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={c?.["shipping type"]} />
						),
						cell: ({ row: { original: r } }) => (
							<div className="flex items-center justify-center">
								<div>Fast Shipping</div>{" "}
							</div>
						),
					},
					{
						accessorKey: "id",
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={c?.["payment status"]} />
						),
						cell: ({ row: { original: r } }) => (
							<div className="flex items-center justify-center">
								<Badge
									variant={(() => {
										switch ("CONFIRMED") {
											case "CONFIRMED":
												return "default";
											// case "DELIVERYED":
											// 	return "secondary";
											default:
												return "outline";
										}
									})()}
								>
									{orderStatus({ locale })?.find((e) => e?.["value"] === "CONFIRMED")?.["label"]}
								</Badge>
							</div>
						),
					},
					{
						accessorKey: "createdAt",
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={c?.["createdAt"]} />
						),
						cell: ({ row: { original: r } }) => (
							<div className="flex items-center justify-center">
								<div className="flex items-center gap-2">
									{new Date(r?.["createdAt"]!)?.toLocaleString()}
								</div>
							</div>
						),
					},
					{
						id: "actions",
						cell: ({ row: { original: r } }) => {
							return (
								<div className="flex items-center justify-center">
									<DataTableRowActions dic={dic}>
										<LocaleLink href={`/ss/${r?.["storeId"]}/orders/${r?.["id"]}`}>
											<DropdownMenuItem className="cursor-pointer">{c?.["edit"]}</DropdownMenuItem>
										</LocaleLink>
										<OrderDeleteButton
											dic={dic}
											order={r}
											variant="ghost"
											className="w-full justify-start px-2 text-start font-normal"
										/>
									</DataTableRowActions>
								</div>
							);
						},
					},
				] as ColumnDef<ColumnType>[]
			}
		/>
	);
}
