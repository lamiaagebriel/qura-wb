"use client";

import * as React from "react";

import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Table as TTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale } from "@/components/locale-provider";

type State = {
  columnFilters: ColumnFiltersState;
  sorting: SortingState;
  pagination: PaginationState;
  columnVisibility: VisibilityState;
};

type DataTableContextProps<TData> = {
  table: TTable<TData>;
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
} & DataTableProviderProps<TData, any>;

const DataTableContext = React.createContext<
  DataTableContextProps<any> | undefined
>(undefined);

export function useDataTable<TData>() {
  const context = React.useContext(DataTableContext);
  if (!context)
    throw new Error("useDataTable must be used within DataTableProvider");

  return context as DataTableContextProps<TData>;
}

type DataTableProviderProps<TData, TValue> = React.PropsWithChildren<{
  data: TData[];
  columns: ColumnDef<TData, TValue>[];

  // defaultColumnFilters?: ColumnFiltersState;
  // filterFields?: DataTableFilterField<TData>[];
}>;

export function DataTableProvider<TData, TValue>({
  data = [],
  columns,

  children,
}: DataTableProviderProps<TData, TValue>) {
  const [state, setState] = React.useState<State>({
    columnFilters:
      //  defaultColumnFilters??
      [],

    sorting: [],
    pagination: {
      pageIndex: 0,
      pageSize: 20,
    },
    columnVisibility: {},
    // rowSelection: {},
  });

  const table = useReactTable({
    data,
    columns,
    state,
    enableRowSelection: true,
    onRowSelectionChange: (selection) =>
      setState((prev) => ({ ...prev, rowSelection: selection })),
    // onSortingChange: (sort) => setState((prev) => ({ ...prev, sorting: sort })),
    // onColumnFiltersChange: (filters) => {
    //   setState((prev) => ({ ...prev, columnFilters: filters }));
    //   // Sync with URL
    //   filters.forEach(({ id, value }) => {
    //     if (value) searchParams.set(id, value);
    //     else searchParams.delete(id);
    //   });
    //   setSearchParams(searchParams);
    // },
    // onColumnVisibilityChange: (v) =>
    //   setState((prev) => ({ ...prev, columnVisibility: v })),
    // onPaginationChange: (v) => setState((prev) => ({ ...prev, pagination: v })),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const value = React.useMemo(
    () => ({
      table,
      state,
      setState,
      data,
      columns,
    }),
    [table, state, data, columns]
  );

  return (
    <DataTableContext.Provider value={value}>
      {children}
    </DataTableContext.Provider>
  );
}

export function DataTable() {
  const { "data-table": c } = useLocale();
  const { table, columns } = useDataTable();

  return (
    <Table>
      <TableHeader className="bg-muted/50">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="hover:bg-transparent">
            {headerGroup.headers.map((header) => {
              return (
                <TableHead key={header.id}>
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
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              {c?.["no results."]}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

type DataTableColumnHeaderProps<TData, TValue> =
  React.HTMLAttributes<HTMLDivElement> & {
    column: Column<TData, TValue>;
    title: string;
  };

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  const { "data-table-column-header": c } = useLocale();
  // if (!column.getCanSort()) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 whitespace-nowrap",
        className
      )}
      {...props}
    >
      {title}
    </div>
  );
  // }

  // return (
  //   <div
  //     className={cn(
  //       "flex items-center justify-center gap-2 whitespace-nowrap",
  //       className
  //     )}
  //     {...props}
  //   >
  //     <DropdownMenu>
  //       <DropdownMenuTrigger asChild>
  //         <Button
  //           variant="ghost"
  //           size="sm"
  //           className="-ml-3 h-8 data-[state=open]:bg-accent"
  //         >
  //           <span>{title}</span>
  //           {column.getIsSorted() === "desc" ? (
  //             <ArrowUp className="ml-2 h-4 w-4" />
  //           ) : column.getIsSorted() === "asc" ? (
  //             <ArrowDown className="ml-2 h-4 w-4" />
  //           ) : (
  //             <ChevronsUpDown className="ml-2 h-4 w-4" />
  //           )}
  //         </Button>
  //       </DropdownMenuTrigger>
  //       <DropdownMenuContent align="start">
  //         <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
  //           <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
  //           {c?.["asc"]}
  //         </DropdownMenuItem>
  //         <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
  //           <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
  //           {c?.["desc"]}
  //         </DropdownMenuItem>
  //       </DropdownMenuContent>
  //     </DropdownMenu>
  //   </div>
  // );
}

export function DataTableColumnCell({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 whitespace-nowrap",
        className
      )}
      {...props}
    />
  );
}

export type DataTableRowActionsProps = React.PropsWithChildren<{}>;
export function DataTableRowActions({ children }: DataTableRowActionsProps) {
  const { "data-table-row-actions": c } = useLocale();

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="size-4 shrink-0" />
            <span className="sr-only">{c?.["open menu"]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-full max-w-40">
          <DropdownMenuLabel>{c?.["actions"]}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
