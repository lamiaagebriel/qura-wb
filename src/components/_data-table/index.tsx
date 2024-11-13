"use client";

import {
	DataTablePagination,
	DataTablePaginationProps,
} from "@/components/_data-table/data-table-pagination";
import {
	DataTableToolbar,
	DataTableToolbarProps,
} from "@/components/_data-table/data-table-toolbar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Dictionary } from "@/types/locale";
import {
	ColumnDef,
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
	VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";
import { DataTableColumnHeaderProps } from "@/components/_data-table/data-table-column-header";
import { DataTableRowActionsProps } from "@/components/_data-table/data-table-row-actions";
import { DataTableViewOptionsProps } from "@/components/_data-table/data-table-view-options";

export type DataTableProps<TData, TValue> = {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
} & Pick<DataTableToolbarProps<TData>, "filterBy" | "filterOptions"> &
	Dictionary["data-table"] &
	Pick<DataTablePaginationProps<TData>, "dic"> &
	Pick<DataTableViewOptionsProps<TData>, "dic"> &
	// optional
	Pick<DataTableRowActionsProps, "dic"> &
	Pick<DataTableToolbarProps<TData>, "dic"> &
	Pick<DataTableColumnHeaderProps<TData, TValue>, "dic">;

export * from "./data-table-column-header";
export * from "./data-table-faceted-filter";
export * from "./data-table-pagination";
export * from "./data-table-row-actions";
export * from "./data-table-toolbar";
export * from "./data-table-view-options";

export function DataTable<TData, TValue>({
	dic: { "data-table": c, ...dic },
	columns,
	data,
	filterBy,
	filterOptions,
}: DataTableProps<TData, TValue>) {
	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
		},
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	return (
		<div className="space-y-4">
			{/* {view ||
				(filterBy && filterOptions && (
					<DataTableToolbar
						dic={dic}
						table={table}
						filterBy={filterBy}
						filterOptions={filterOptions}
					/>
				))} */}

			{filterBy && (
				<DataTableToolbar
					dic={dic}
					table={table}
					filterBy={filterBy}
					filterOptions={filterOptions}
				/>
			)}
			<div className="rounded-xl shadow">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup, i) => (
							<TableRow key={i}>
								{headerGroup.headers.map((header, j) => {
									return (
										<TableHead key={j} colSpan={header.colSpan} className="whitespace-nowrap">
											{header.isPlaceholder
												? null
												: flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row, i) => (
								<TableRow key={i} data-state={row.getIsSelected() && "selected"}>
									{row.getVisibleCells().map((cell, j) => (
										<TableCell key={j}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length}>
									<div className="flex min-h-40 flex-col items-center justify-center border-none">
										<p className="text-sm">{c?.["no results."]}</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<DataTablePagination dic={dic} table={table} />
		</div>
	);
}
