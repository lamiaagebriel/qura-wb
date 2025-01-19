"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Minus } from "lucide-react";

import { Product } from "@/servers/db/schema";
import { deleteProduct } from "@/servers/products";
import { formatDate } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DataTableColumnCell,
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/ui/data-table";
import { FormButton } from "@/components/ui/form";
import { Icons } from "@/components/icons";
import { Image } from "@/components/image";
import { Link } from "@/components/link";
import { useLocale } from "@/components/locale-provider";

type Data = Product;
export const columns: ColumnDef<Data>[] = [
  {
    accessorKey: "id",
    enableHiding: false,
    enableSorting: false,
    header: function Component({ column }) {
      const { tables: t } = useLocale();
      return (
        <DataTableColumnHeader
          column={column}
          title={t?.["product details"]}
          className="justify-start"
        />
      );
    },
    cell: ({ row: { original: r } }) => {
      return (
        <Link href={`/ss/${r?.storeId}/products/${r?.id}`}>
          <DataTableColumnCell className="justify-start">
            <div className="flex items-start gap-2">
              <Image
                src={r?.images?.[0] ?? ""}
                alt="product main image"
                className="size-20"
              />
              <div>
                <h1 className="font-semibold">{r?.title}</h1>
              </div>
            </div>
          </DataTableColumnCell>
        </Link>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: function Component({ column }) {
      const { tables: t } = useLocale();
      return (
        <DataTableColumnHeader
          column={column}
          title={t?.["created at"]}
          className="justify-end"
        />
      );
    },
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
