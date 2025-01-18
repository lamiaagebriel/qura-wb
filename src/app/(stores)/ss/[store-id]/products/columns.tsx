"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Minus } from "lucide-react";

import { Product } from "@/servers/db/schema";
import { deleteProduct } from "@/servers/products";
import { formatDate } from "@/lib/utils";

import {
  DataTableColumnCell,
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/ui/data-table";
import { FormButton } from "@/components/ui/form";
import { Link } from "@/components/link";

type Data = Product;
export const columns: ColumnDef<Data>[] = [
  {
    accessorKey: "id",
    enableHiding: false,
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="الرقم التعريفي"
        className="justify-start"
      />
    ),
    cell: ({ row: { original: r } }) => {
      return (
        <DataTableColumnCell>
          <Link href={`/ss/${r?.storeId}/products/${r?.id}`}>{r?.id}</Link>
        </DataTableColumnCell>
      );
    },
  },
  {
    accessorKey: "title",
    enableHiding: false,
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="العنوان" />
    ),
    cell: ({ row: { original: r } }) => {
      return (
        <DataTableColumnCell>
          <Link href={`/ss/${r?.storeId}/products/${r?.id}`}>{r?.title}</Link>
        </DataTableColumnCell>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="تاريخ الإنشاء"
        className="justify-end"
      />
    ),
    cell: ({ row: { original: r } }) => {
      const value = r?.createdAt;
      if (!value)
        return (
          <DataTableColumnCell>
            <Minus className="size-4 text-muted-foreground/50" />
          </DataTableColumnCell>
        );

      return (
        <DataTableColumnCell className="justify-end">
          {formatDate(value)}
        </DataTableColumnCell>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row: { original: r } }) => (
      <div className="flex items-center justify-center">
        <DataTableRowActions>
          <FormButton
            variant="ghost"
            className="w-full justify-start px-2 text-start font-normal text-destructive hover:text-destructive"
            onAction={deleteProduct}
            useForm={{
              defaultValues: { id: r?.id, storeId: r?.storeId },
            }}
          >
            delete product
          </FormButton>
        </DataTableRowActions>
      </div>
    ),
  },
];
