"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { Dictionary } from "@/types/locale";
import { Store } from "@prisma/client";
import { DataTableRowActions } from "./data-table-row-actions";
import { Link } from "./link";
import { StoreBinButton } from "./store-bin-button";
import { StoreUpdateButton } from "./store-update-button";
import { buttonVariants } from "./ui/button";
import { DropdownMenuSeparator } from "./ui/dropdown-menu";

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
            cell: ({ row: { original: r } }) => (
              <Link
                href={`/dashboard/s/${r?.["id"]}`}
                className={buttonVariants({ variant: "link" })}
              >
                {r?.["name"]}
              </Link>
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
                    <StoreUpdateButton
                      dic={dic}
                      store={r}
                      variant="ghost"
                      className="w-full justify-start px-2 text-start font-normal"
                    />
                    <DropdownMenuSeparator />

                    <StoreBinButton
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
