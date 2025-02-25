"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Trash } from "lucide-react";

import { CartProduct, useCart } from "@/lib/redux";
import { formatNumber, formatPrice } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTableColumnCell,
  DataTableColumnHeader,
  DataTableProvider,
  DataTableRowActions,
} from "@/components/ui/data-table";
import { FormButton } from "@/components/ui/form";
import { Icons } from "@/components/icons";
import { Image } from "@/components/image";
import { Link } from "@/components/link";
import { useLocale } from "@/components/locale-provider";

type Data = CartProduct;
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
          title={t["product details"]}
          className="justify-start"
        />
      );
    },
    cell: ({
      row: {
        original: { product: r, attributes },
      },
    }) => {
      return (
        <DataTableColumnCell className="justify-start">
          <div className="flex items-start gap-2">
            <Image
              src={r?.images?.[0]!}
              alt="product main image"
              className="size-20"
            />
            <div>
              <div>
                <Link
                  href={`/s/${r?.storeId}/p/${r?.id}`}
                  className="underline"
                >
                  <h1 className="font-semibold">{r?.title}</h1>
                </Link>
                <p className="text-muted-foreground">
                  {[
                    ...attributes?.map((e) => [e?.name, e?.value].join(": ")),
                  ].join(", ")}
                </p>
              </div>
            </div>
          </div>
        </DataTableColumnCell>
      );
    },
  },
  {
    accessorKey: "quantity",
    enableHiding: false,
    enableSorting: false,
    header: function Component({ column }) {
      const { tables: t } = useLocale();
      return <DataTableColumnHeader column={column} title={t["quantity"]} />;
    },
    cell: function Component({ row: { original: r } }) {
      const cart = useCart();
      const value = formatNumber(r?.quantity ?? "0");

      if (!value)
        return (
          <DataTableColumnCell>
            <Icons.minus className="text-muted-foreground/50" />
          </DataTableColumnCell>
        );

      return (
        <DataTableColumnCell className="flex flex-col gap-1">
          <div className="flex w-fit items-center gap-1 rounded-full border border-primary">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => {
                cart?.addToCart({ ...r, quantity: 1 });
              }}
            >
              <Icons.add />
            </Button>

            {value}

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => {
                cart?.removeFromCart({ ...r, quantity: 1 });
              }}
            >
              <Icons.minus />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            max quantity: {formatNumber(r?.product?.stock ?? "0")}
          </p>
        </DataTableColumnCell>
      );
    },
  },
  {
    accessorKey: "price",
    enableHiding: false,
    enableSorting: false,
    header: function Component({ column }) {
      const { tables: t } = useLocale();
      return <DataTableColumnHeader column={column} title={t["price"]} />;
    },
    cell: ({ row: { original: r } }) => {
      const value = formatPrice(
        Number(r?.product?.price! ?? "0") * r?.quantity
      );

      if (!value)
        return (
          <DataTableColumnCell>
            <Icons.minus className="text-muted-foreground/50" />
          </DataTableColumnCell>
        );

      return (
        <DataTableColumnCell className="flex flex-col gap-1">
          <p>{value}</p>
          <p className="text-xs text-muted-foreground">
            unit price: {formatPrice(r?.product?.price ?? "0")}
          </p>
        </DataTableColumnCell>
      );
    },
  },
  {
    id: "actions",
    cell: function Component({ row: { original: r } }) {
      const cart = useCart();
      return (
        <DataTableColumnCell className="flex items-center justify-center">
          <FormButton
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              cart?.removeFromCart(r);
            }}
          >
            <Trash />
          </FormButton>
        </DataTableColumnCell>
      );
    },
  },
];
