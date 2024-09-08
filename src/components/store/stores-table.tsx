"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTable, DataTableProps } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { Link } from "@/components/link";
import { StoreBinButton } from "@/components/store/store-bin-button";
import { StoreUpdateButton } from "@/components/store/store-update-button";
import { buttonVariants } from "@/components/ui/button";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dictionary } from "@/types/locale";
import { Store } from "@prisma/client";

type ColumnType = Store;

type StoresTableProps = {
  data: ColumnType[];
} & Pick<DataTableProps<any, any>, "dic"> &
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
                  <DataTableRowActions dic={dic}>
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
