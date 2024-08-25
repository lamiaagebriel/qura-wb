"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { DataTableRowActions } from "@/components/data-table-row-actions";

import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dictionary } from "@/types/locale";
import { Store } from "@prisma/client";
import { StoreDeleteButton } from "./store-delete-button";
import { StoreRestoreButton } from "./store-restore-button";

type ColumnType = Store;

type BinStoresTableProps = {
  data: ColumnType[];
} & Dictionary["data-table"] &
  Dictionary["data-table-column-header"] &
  Dictionary["data-table-pagination"] &
  Dictionary["data-table-view-options"] &
  Dictionary["responsive-dialog"] &
  Dictionary["store-restore-button"] &
  Dictionary["store-delete-button"] &
  Dictionary["store-form"] &
  Dictionary["bin-stores-table"];

export function BinStoresTable({
  dic: { "bin-stores-table": c, ...dic },
  data,
}: BinStoresTableProps) {
  return (
    <DataTable
      dic={dic}
      data={data}
      columns={
        [
          {
            accessorKey: "name",
            header: ({ column }) => (
              <DataTableColumnHeader
                dic={dic}
                column={column}
                title={c?.["name"]}
              />
            ),
            enableSorting: false,
            enableHiding: false,
          },
          {
            accessorKey: "deletedAt",
            header: ({ column }) => (
              <DataTableColumnHeader
                dic={dic}
                column={column}
                title={c?.["deletedAt"]}
              />
            ),
            cell: ({ row: { original: r } }) => (
              <div className="flex items-center gap-2">
                {new Date(r?.["deletedAt"]!)?.toLocaleDateString()}
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
                  <DataTableRowActions>
                    <StoreRestoreButton
                      dic={dic}
                      store={r}
                      variant="ghost"
                      className="w-full justify-start px-2 text-start font-normal"
                    />
                    <DropdownMenuSeparator />

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
