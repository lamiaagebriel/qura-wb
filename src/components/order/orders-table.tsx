"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTable, DataTableProps } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { Link } from "@/components/link";
import { OrderBinButton } from "@/components/order/order-bin-button";
import { OrderUpdateButton } from "@/components/order/order-update-button";
import { buttonVariants } from "@/components/ui/button";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Dictionary } from "@/types/locale";
import { Order, OrderProductDetails, Product, Store } from "@prisma/client";

type ColumnType = Order & {
  store: Pick<Store, "deletedAt">;
  products: (OrderProductDetails & {
    product: Pick<Product, "name" | "deletedAt">;
  })[];
};

type OrdersTableProps = {
  data: ColumnType[];
} & Pick<DataTableProps<any, any>, "dic"> &
  Dictionary["responsive-dialog"] &
  Dictionary["orders-table"] &
  Dictionary["db"] &
  Dictionary["order-form"] &
  Dictionary["order-update-button"] &
  Dictionary["order-bin-button"];

export function OrdersTable({
  dic: { "orders-table": c, db, ...dic },
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
                title={c?.["status"]}
              />
            ),
            cell: ({ row: { original: r } }) => {
              const status = db?.["enums"]?.OrderStatus?.find(
                (e) => e?.["value"] === r?.["status"]
              );

              return <div>{status?.["label"]}</div>;
            },
            enableSorting: false,
            enableHiding: false,
          },
          {
            accessorKey: "products",
            header: ({ column }) => (
              <DataTableColumnHeader
                dic={dic}
                column={column}
                title={c?.["products"]}
              />
            ),
            cell: ({ row: { original: r } }) => (
              <div>
                {r?.["products"]?.map((p, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-4",
                      p?.["product"]?.["deletedAt"] && "line-through"
                    )}
                  >
                    <h1>{p?.["product"]?.["name"]}</h1>
                    <p>{p?.["size"]}</p>
                    <p>{p?.["color"]}</p>
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
