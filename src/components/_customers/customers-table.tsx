"use client";

import {
	DataTable,
	DataTableProps,
	DataTableColumnHeader,
	DataTableRowActions,
} from "@/components/_data-table";
import { Store, User } from "@prisma/client";
import { Dictionary } from "@/types/locale";
import { ColumnDef } from "@tanstack/react-table";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { LocaleLink } from "@/components/links";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";

type ColumnType = User;
type CustomersTableProps = {
	data: ColumnType[];
	store: Pick<Store, "id">;
} & Pick<DataTableProps<any, any>, "dic"> &
	Dictionary["customers-table"];

export function CustomersTable({
	dic: { "customers-table": c, ...dic },
	data,
	store,
}: CustomersTableProps) {
	return (
		<DataTable
			dic={dic}
			data={data}
			columns={
				[
					{
						accessorKey: "id",
						header: ({ column }) => (
							<DataTableColumnHeader
								dic={dic}
								column={column}
								title={c?.["customer details"]}
								className="justify-start"
							/>
						),
						cell: ({ row: { original: r } }) => (
							<div className="flex items-center gap-2 text-start">
								<Avatar>
									<AvatarImage src={r?.["image"]!} alt="" />
									<AvatarFallback text={r?.["name"]!}>
										<Icons.user />
									</AvatarFallback>
								</Avatar>
								<div>
									<h2>{r?.["name"]}</h2>
									<p className="text-xs text-muted-foreground">{r?.["email"]}</p>
								</div>
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
										<LocaleLink href={`/ss/${store?.["id"]}/customers/${r?.["id"]}`}>
											<DropdownMenuItem className="cursor-pointer">
												{c?.["preview"]}
											</DropdownMenuItem>
										</LocaleLink>
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
