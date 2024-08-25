"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { DataTableRowActions } from "@/components/data-table-row-actions";

import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dictionary } from "@/types/locale";
import { Order } from "@prisma/client";
import { OrderDeleteButton } from "./order-delete-button";
import { OrderRestoreButton } from "./order-restore-button";

type ColumnType = Order;

type BinOrdersTableProps = {
  data: ColumnType[];
} & Dictionary["data-table"] &
  Dictionary["data-table-column-header"] &
  Dictionary["data-table-pagination"] &
  Dictionary["data-table-view-options"] &
  Dictionary["responsive-dialog"] &
  Dictionary["order-restore-button"] &
  Dictionary["order-delete-button"] &
  Dictionary["order-form"] &
  Dictionary["bin-orders-table"];

export function BinOrdersTable({
  dic: { "bin-orders-table": c, ...dic },
  data,
}: BinOrdersTableProps) {
  return (
    <DataTable
      dic={dic}
      data={data}
      columns={
        [
          {
            accessorKey: "id",
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
                    <OrderRestoreButton
                      dic={dic}
                      order={r}
                      variant="ghost"
                      className="w-full justify-start px-2 text-start font-normal"
                    />
                    <DropdownMenuSeparator />

                    <OrderDeleteButton
                      dic={dic}
                      order={r}
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
