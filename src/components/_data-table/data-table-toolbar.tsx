"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { SelectItem } from "@/types";
import { Dictionary } from "@/types/locale";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { DataTableViewOptions } from "./data-table-view-options";

export type DataTableToolbarProps<TData> = {
  table: Table<TData>;
  filterBy?: string;
  filterOptions?: {
    column: string;
    title: string;
    options: SelectItem[];
  }[];
  view?: string;
} & Dictionary["data-table-view-options"];

export function DataTableToolbar<TData>({
  dic: { ...dic },
  table,
  filterBy,
  filterOptions,
  view,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {filterBy && (
          <Input
            placeholder="Filter ..."
            value={
              (table.getColumn(filterBy)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(filterBy)?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}

        {/* TODO: fix filter badges */}
        {/* {filterOptions?.map((option, i) => {
          return (
            table.getColumn(option?.["column"]) && (
              <DataTableFacetedFilter
                column={table.getColumn(option?.["column"])}
                title={option?.["title"]}
                options={option?.["options"]}
              />
            )
          );
        })} */}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      {view && <DataTableViewOptions dic={dic} table={table} />}
    </div>
  );
}
