"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTable, DataTableProps } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";

import { ProductDeleteButton } from "@/components/product/product-delete-button";
import { ProductRestoreButton } from "@/components/product/product-restore-button";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dictionary } from "@/types/locale";
import { Product } from "@prisma/client";

type ColumnType = Product;

type BinProductsTableProps = {
  data: ColumnType[];
} & Pick<DataTableProps<any, any>, "dic"> &
  Dictionary["responsive-dialog"] &
  Dictionary["product-restore-button"] &
  Dictionary["product-delete-button"] &
  Dictionary["product-form"] &
  Dictionary["bin-products-table"];

export function BinProductsTable({
  dic: { "bin-products-table": c, ...dic },
  data,
}: BinProductsTableProps) {
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
                  <DataTableRowActions dic={dic}>
                    <ProductRestoreButton
                      dic={dic}
                      product={r}
                      variant="ghost"
                      className="w-full justify-start px-2 text-start font-normal"
                    />
                    <DropdownMenuSeparator />

                    <ProductDeleteButton
                      dic={dic}
                      product={r}
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
