"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Minus } from "lucide-react";

import { Order } from "@/servers/db/schema";
import { formatDate } from "@/lib/utils";

import { DataTableColumnCell, DataTableColumnHeader, DataTableRowActions } from "@/components/ui/data-table";
import { FormButton } from "@/components/ui/form";
import { useLocale } from "@/components/locale-provider";

type Data = Order;
export const columns: ColumnDef<Data>[] = [
  {
    accessorKey: "id",
    enableHiding: false,
    enableSorting: false,
    header: function Component({ column }) {
      const { tables: t } = useLocale();
      return <DataTableColumnHeader column={column} title={"order details"} className="justify-start" />;
    },
  },
  {
    accessorKey: "createdAt",
    header: function Component({ column }) {
      const { tables: t } = useLocale();
      return <DataTableColumnHeader column={column} title={t["created at"]} className="justify-end" />;
    },
    cell: ({ row: { original: r } }) => {
      const value = r?.createdAt;
      if (!value)
        return (
          <DataTableColumnCell>
            <Minus className="size-4 text-muted-foreground/50" />
          </DataTableColumnCell>
        );

      return <DataTableColumnCell className="justify-end">{formatDate(value)}</DataTableColumnCell>;
    },
  },
  {
    id: "actions",
    cell: function Component({ row: { original: r } }) {
      const { cmn } = useLocale();
      return (
        <div className="flex items-center justify-center">
          <DataTableRowActions>
            <FormButton
              variant="ghost"
              className="w-full justify-start px-2 text-start font-normal text-destructive hover:text-destructive"
              // onAction={deleteOrder}
              useForm={{
                defaultValues: { ...r },
              }}>
              {cmn["delete"]}
            </FormButton>
          </DataTableRowActions>
        </div>
      );
    },
  },
];
