import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dictionary } from "@/types/locale";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

export type DataTablePaginationProps<TData> = {
  table: Table<TData>;
} & Dictionary["data-table-pagination"];

export function DataTablePagination<TData>({
  dic: { "data-table-pagination": c },
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} {c?.["of"]}{" "}
        {table.getFilteredRowModel().rows.length} {c?.["row(s) selected."]}
      </div>
      <div className="flex items-center gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px] bg-background">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm font-medium">{c?.["rows per page"]}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">{c?.["go to first page"]}</span>
            <DoubleArrowLeftIcon className="h-4 w-4 rtl:rotate-180" />
          </Button>

          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">{c?.["go to previous page"]}</span>
            <ChevronLeftIcon className="h-4 w-4 rtl:rotate-180" />
          </Button>

          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">{c?.["go to next page"]}</span>
            <ChevronRightIcon className="h-4 w-4 rtl:rotate-180" />
          </Button>

          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">{c?.["go to last page"]}</span>
            <DoubleArrowRightIcon className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
        <div className="flex items-center justify-center text-sm font-medium">
          {c?.["page"]} {table.getState().pagination.pageIndex + 1} {c?.["of"]}{" "}
          {table.getPageCount()}
        </div>
      </div>
    </div>
  );
}
