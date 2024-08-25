"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { Dictionary } from "@/types/locale";
import { Order, OrderProductDetails, Product, Store } from "@prisma/client";
import { DataTableRowActions } from "./data-table-row-actions";
import { Link } from "./link";
import { OrderBinButton } from "./order-bin-button";
import { OrderUpdateButton } from "./order-update-button";
import { buttonVariants } from "./ui/button";
import { DropdownMenuSeparator } from "./ui/dropdown-menu";

type ColumnType = Order & {
  store: Pick<Store, "deletedAt">;
  products: (OrderProductDetails & { product: Pick<Product, "name"> })[];
};

type OrdersTableProps = {
  data: ColumnType[];
} & Dictionary["data-table"] &
  Dictionary["data-table-column-header"] &
  Dictionary["data-table-pagination"] &
  Dictionary["data-table-view-options"] &
  Dictionary["responsive-dialog"] &
  Dictionary["orders-table"] &
  Dictionary["order-form"] &
  Dictionary["order-update-button"] &
  Dictionary["order-bin-button"];

export function OrdersTable({
  dic: { "orders-table": c, ...dic },
  data,
}: OrdersTableProps) {
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
            cell: ({ row: { original: r } }) => (
              <Link
                href={`/dashboard/s/${r?.["storeId"]}/o/${r?.["id"]}`}
                className={buttonVariants({ variant: "link" })}
              >
                {r?.["id"]}
              </Link>
            ),
            enableSorting: false,
            enableHiding: false,
          },
          {
            accessorKey: "status",
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
            accessorKey: "products",
            header: ({ column }) => (
              <DataTableColumnHeader
                dic={dic}
                column={column}
                title={c?.["name"]}
              />
            ),
            cell: ({ row: { original: r } }) => (
              <div>
                {r?.["products"]?.map((p, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <h1>{p?.["product"]?.["name"]}</h1>

                    <p>{p?.["size"]}</p>
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
                  <DataTableRowActions>
                    <OrderUpdateButton
                      dic={dic}
                      order={r}
                      disabled={storeDeleted}
                      variant="ghost"
                      className="w-full justify-start px-2 text-start font-normal"
                    />
                    <DropdownMenuSeparator />

                    <OrderBinButton
                      dic={dic}
                      order={r}
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
