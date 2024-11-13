"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectItem } from "@/types";
import { Dictionary } from "@/types/locale";
import { Table } from "@tanstack/react-table";
import { DataTableViewOptions, DataTableViewOptionsProps } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { Icons } from "@/components/icons";

export type DataTableToolbarProps<TData> = {
	table: Table<TData>;
	filterBy?: string;
	filterOptions?: {
		column: string;
		title: string;
		options: SelectItem[];
	}[];
} & Dictionary["data-table-toolbar"] &
	Pick<DataTableViewOptionsProps<TData>, "dic">;

export function DataTableToolbar<TData>({
	dic: { "data-table-toolbar": c, ...dic },
	table,
	filterBy,
	filterOptions,
}: DataTableToolbarProps<TData>) {
	const isFiltered = table.getState().columnFilters.length > 0;

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 items-center gap-2">
				{filterBy && (
					<Input
						placeholder={c?.["filter ..."]}
						value={(table.getColumn(filterBy)?.getFilterValue() as string) ?? ""}
						onChange={(event) => table.getColumn(filterBy)?.setFilterValue(event.target.value)}
						className="h-8 w-full max-w-xs"
					/>
				)}

				{/* TODO: fix filter badges */}
				{filterOptions?.map((option, i) => {
					return (
						table.getColumn(option?.["column"]) && (
							<DataTableFacetedFilter
								column={table.getColumn(option?.["column"])}
								title={option?.["title"]}
								options={option?.["options"]}
							/>
						)
					);
				})}

				{isFiltered && (
					<Button variant="ghost" size="sm" onClick={() => table.resetColumnFilters()}>
						{c?.["reset"]}
						<Icons.x />
					</Button>
				)}
			</div>

			{/* <DataTableViewOptions dic={dic} table={table} /> */}
		</div>
	);
}
