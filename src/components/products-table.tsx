"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { Dictionary } from "@/types/locale";
import { Product, Store } from "@prisma/client";
import { DataTableRowActions } from "./data-table-row-actions";
import { Link } from "./link";
import { ProductBinButton } from "./product-bin-button";
import { ProductUpdateButton } from "./product-update-button";
import { buttonVariants } from "./ui/button";
import { DropdownMenuSeparator } from "./ui/dropdown-menu";

type ColumnType = Product & { store: Pick<Store, "deletedAt"> };

type ProductsTableProps = {
  data: ColumnType[];
} & Dictionary["data-table"] &
  Dictionary["data-table-column-header"] &
  Dictionary["data-table-pagination"] &
  Dictionary["data-table-view-options"] &
  Dictionary["responsive-dialog"] &
  Dictionary["products-table"] &
  Dictionary["product-form"] &
  Dictionary["product-update-button"] &
  Dictionary["product-bin-button"];

export function ProductsTable({
  dic: { "products-table": c, ...dic },
  data,
}: ProductsTableProps) {
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
                href={`/dashboard/s/${r?.["storeId"]}/p/${r?.["id"]}`}
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
              const storeDeleted = !!r?.["store"]?.["deletedAt"];

              return (
                <>
                  <DataTableRowActions>
                    <ProductUpdateButton
                      dic={dic}
                      product={r}
                      disabled={storeDeleted}
                      variant="ghost"
                      className="w-full justify-start px-2 text-start font-normal"
                    />
                    <DropdownMenuSeparator />

                    <ProductBinButton
                      dic={dic}
                      product={r}
                      disabled={storeDeleted}
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
