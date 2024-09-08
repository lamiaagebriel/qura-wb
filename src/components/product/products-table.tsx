"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTable, DataTableProps } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { Link } from "@/components/link";
import { ProductBinButton } from "@/components/product/product-bin-button";
import { ProductUpdateButton } from "@/components/product/product-update-button";
import { buttonVariants } from "@/components/ui/button";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dictionary } from "@/types/locale";
import { Order, OrderProductDetails, Product, Store } from "@prisma/client";

type ColumnType = Product & {
  store: Pick<Store, "deletedAt">;
  orders: (OrderProductDetails & { order: Pick<Order, "id"> })[];
};

type ProductsTableProps = {
  data: ColumnType[];
} & Pick<DataTableProps<any, any>, "dic"> &
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
            accessorKey: "sizes",
            header: ({ column }) => (
              <DataTableColumnHeader dic={dic} column={column} title="Sizes" />
            ),
            cell: ({ row: { original: r } }) => (
              <div>[{r?.["sizes"]?.join(", ")}]</div>
            ),
            enableSorting: false,
            enableHiding: false,
          },
          {
            accessorKey: "colors",
            header: ({ column }) => (
              <DataTableColumnHeader dic={dic} column={column} title="Colors" />
            ),
            cell: ({ row: { original: r } }) => (
              <div>[{r?.["colors"]?.join(", ")}]</div>
            ),
            enableSorting: false,
            enableHiding: false,
          },
          {
            accessorKey: "orders",
            header: ({ column }) => (
              <DataTableColumnHeader dic={dic} column={column} title="Orders" />
            ),
            cell: ({ row: { original: r } }) => (
              <div>
                {r?.["orders"]?.map((o, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <h1>{o?.["order"]?.["id"]}</h1>

                    <p>{o?.["size"]}</p>
                    <p>{o?.["color"]}</p>
                  </div>
                ))}
              </div>
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
                  <DataTableRowActions dic={dic}>
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
