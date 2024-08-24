"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { Dictionary } from "@/types/locale";
import { Store } from "@prisma/client";
import { DataTableRowActions } from "./data-table-row-actions";
import { StoreBinButton } from "./store-bin-button";
import { StoreUpdateButton } from "./store-update-button";
import { Button } from "./ui/button";
import {
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "./ui/dropdown-menu";

type ColumnType = Store;

type StoresTableProps = {
  data: ColumnType[];
} & Dictionary["data-table"] &
  Dictionary["data-table-column-header"] &
  Dictionary["data-table-pagination"] &
  Dictionary["data-table-view-options"] &
  Dictionary["responsive-dialog"] &
  Dictionary["stores-table"] &
  Dictionary["store-form"] &
  Dictionary["store-update-button"] &
  Dictionary["store-bin-button"];

export function StoresTable({
  dic: { "stores-table": c, ...dic },
  data,
}: StoresTableProps) {
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
            id: "actions",
            cell: ({ row: { original: r } }) => {
              return (
                <>
                  <DataTableRowActions>
                    <StoreUpdateButton dic={dic} store={r}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-2 text-start font-normal"
                      >
                        {c?.["edit"]}
                      </Button>
                    </StoreUpdateButton>
                    <DropdownMenuSeparator />

                    <StoreBinButton dic={dic} store={r}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-2 text-start font-normal"
                      >
                        {c?.["delete"]}
                        <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                      </Button>
                    </StoreBinButton>
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
