"use client";

import {
	DataTable,
	DataTableProps,
	DataTableColumnHeader,
	DataTableRowActions,
} from "@/components/_data-table";
import { Link } from "@/components/link";
import { buttonVariants } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Dictionary } from "@/types/locale";
import { Store } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import {
	StoreDeleteButton,
	StoreDeleteButtonProps,
} from "@/components/_stores/store-delete-button";
import {
	StoreUpdateButton,
	StoreUpdateButtonProps,
} from "@/components/_stores/store-update-button";
import { Image } from "../image";

type ColumnType = Store;
type StoresTableProps = {
	data: ColumnType[];
} & Pick<DataTableProps<any, any>, "dic"> &
	Pick<StoreUpdateButtonProps, "dic"> &
	Pick<StoreDeleteButtonProps, "dic"> &
	Dictionary["stores-table"];

export function StoresTable({ dic: { "stores-table": c, ...dic }, data }: StoresTableProps) {
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
								href={`/dashboard/s/${r?.["id"]}`}
								className={buttonVariants({
									variant: "link",
									className: "h-12 w-full justify-start gap-2",
								})}
							>
								<Image
									src={r?.["logo"]!}
									alt={`${r?.["name"]} Image`}
									className="aspect-square size-12 rounded-full"
								/>

								<div className="space-y-2">
									<CardTitle>{r?.["name"]}</CardTitle>
									<CardDescription>{r?.["category"]}</CardDescription>
								</div>
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
										<StoreUpdateButton
											dic={dic}
											store={r}
											variant="ghost"
											className="w-full justify-start px-2 text-start font-normal"
										/>
										<StoreDeleteButton
											dic={dic}
											store={r}
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
