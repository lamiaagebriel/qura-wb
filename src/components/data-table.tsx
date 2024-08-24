"use client";

import { DataTablePagination } from "@/components/data-table-pagination";
import {
  DataTableToolbar,
  DataTableToolbarProps,
} from "@/components/data-table-toolbar";
import { EmptyPlaceholder } from "@/components/empty-placeholder";
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
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
} & Pick<DataTableToolbarProps<TData>, "filterBy" | "filterOptions" | "view"> &
  Dictionary["data-table"] &
  Dictionary["data-table-pagination"] &
  Dictionary["data-table-view-options"];

export function DataTable<TData, TValue>({
  dic: { "data-table": c, ...dic },
  columns,
  data,
  filterBy,
  filterOptions,
  view,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
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
      {view ||
        (filterBy && filterOptions && (
          <DataTableToolbar
            dic={dic}
            table={table}
            filterBy={filterBy}
            filterOptions={filterOptions}
          />
        ))}
      <div className="rounded-xl border bg-card shadow">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup, i) => (
              <TableRow key={i}>
                {headerGroup.headers.map((header, j) => {
                  return (
                    <TableHead
                      key={j}
                      colSpan={header.colSpan}
                      className="whitespace-nowrap"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, i) => (
                <TableRow
                  key={i}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell, j) => (
                    <TableCell key={j}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyPlaceholder className="min-h-20 border-none">
                    <EmptyPlaceholder.Icon name="empty" />
                    <EmptyPlaceholder.Description className="text-center">
                      {c?.["no results."]}
                    </EmptyPlaceholder.Description>
                  </EmptyPlaceholder>
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
