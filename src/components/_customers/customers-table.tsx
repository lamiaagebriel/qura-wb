"use client";

import {
	DataTable,
	DataTableProps,
	DataTableColumnHeader,
	DataTableRowActions,
} from "@/components/_data-table";
import { User } from "@prisma/client";
import { CardTitle } from "@/components/ui/card";
import { Dictionary } from "@/types/locale";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Image } from "@/components/image";
import { cn } from "@/lib/shadcn";

type ColumnType = User;
type CustomersTableProps = {
	data: ColumnType[];
} & Pick<DataTableProps<any, any>, "dic"> &
	// Pick<CustomerDeleteButtonProps, "dic"> &
	Dictionary["customers-table"];

export function CustomersTable({
	dic: { "customers-table": c, ...dic },
	data,
}: CustomersTableProps) {
	return (
		<DataTable
			dic={dic}
			data={data}
			columns={
				[
					{
						accessorKey: "name",
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={"Customer Code"} />
						),
						cell: ({ row: { original: r } }) => (
							<div className={cn("flex h-28 w-full items-start justify-start gap-2 px-4 py-2")}>
								<Image
									src={r?.["image"]!}
									alt={`${r?.["name"]} Image`}
									className="aspect-square size-24 rounded-xl"
								/>

								<div className="space-y-2">
									<CardTitle>{r?.["name"]}</CardTitle>
								</div>
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
				] as ColumnDef<ColumnType>[]
			}
		/>
	);
}
