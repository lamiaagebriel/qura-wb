"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Minus } from "lucide-react";

import { Product } from "@/servers/db/schema";
import { deleteProduct } from "@/servers/products";
import { formatDate, formatNumber, formatPrice } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DataTableColumnCell,
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/ui/data-table";
import { FormAlertDialogButton, FormButton } from "@/components/ui/form";
import { Tooltip } from "@/components/ui/tooltip";
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
          title={t["product details"]}
          className="justify-start"
        />
      );
    },
    cell: ({ row: { original: r } }) => {
      const {
        db: { products: pp },
      } = useLocale();
      const status = pp?.status?.enums[r?.status];

      return (
        <DataTableColumnCell className="justify-start">
          <div className="flex items-start gap-2">
            <div className="relative">
              <Image
                src={r?.images?.[0]!}
                alt="product main image"
                className="size-20"
              />
              <Tooltip tip={status?.label}>
                <Icons.dot
                  style={{ backgroundColor: status?.color }}
                  className="absolute bottom-0 right-0"
                />
              </Tooltip>
            </div>

            <div>
              <Link
                href={`/ss/${r?.storeId}/products/${r?.id}`}
                className="underline"
              >
                <h1 className="font-semibold">{r?.title}</h1>
              </Link>
              <p className="mb-2 text-xs text-muted-foreground">{r?.slug}</p>
              <p className="line-clamp-2 max-w-prose whitespace-normal text-xs text-muted-foreground">
                {r?.description}
              </p>
            </div>
          </div>
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
      const price = formatPrice(r?.price);
      const compareToPrice = formatPrice(r?.compareToPrice);
      const cost = formatPrice(r?.cost);

      if (!price)
        return (
          <DataTableColumnCell>
            <Minus className="size-4 text-muted-foreground/50" />
          </DataTableColumnCell>
        );

      return (
        <DataTableColumnCell className="flex-col gap-0.5">
          <p>
            {price} -{" "}
            {compareToPrice ? (
              <span className="text-destructive line-through">
                {compareToPrice}
              </span>
            ) : null}
          </p>

          <p className="text-xs text-muted-foreground">cost: {cost}</p>
        </DataTableColumnCell>
      );
    },
  },
  {
    accessorKey: "profit",
    enableHiding: false,
    enableSorting: false,
    header: function Component({ column }) {
      const { tables: t } = useLocale();
      return <DataTableColumnHeader column={column} title={t["profit"]} />;
    },
    cell: ({ row: { original: r } }) => {
      const price = r?.price;
      const cost = r?.cost;

      if (!price || !cost)
        return (
          <DataTableColumnCell>
            <Minus className="size-4 text-muted-foreground/50" />
          </DataTableColumnCell>
        );

      return (
        <DataTableColumnCell className="flex-col gap-0.5">
          {formatPrice(Number(price) - Number(cost))}
        </DataTableColumnCell>
      );
    },
  },
  {
    accessorKey: "stock",
    enableHiding: false,
    enableSorting: false,
    header: function Component({ column }) {
      const { tables: t } = useLocale();
      return <DataTableColumnHeader column={column} title={t["stock"]} />;
    },
    cell: ({ row: { original: r } }) => {
      const value = r?.stock;

      if (!value)
        return (
          <DataTableColumnCell>
            <Minus className="size-4 text-muted-foreground/50" />
          </DataTableColumnCell>
        );

      return <DataTableColumnCell>{value}</DataTableColumnCell>;
    },
  },
  {
    accessorKey: "createdAt",
    header: function Component({ column }) {
      const { tables: t } = useLocale();
      return (
        <DataTableColumnHeader
          column={column}
          title={t["created at"]}
          className="justify-end"
        />
      );
    },
    cell: ({ row: { original: r } }) => {
      const { locale } = useLocale();
      const value = r?.createdAt;
      if (!value)
        return (
          <DataTableColumnCell>
            <Minus className="size-4 text-muted-foreground/50" />
          </DataTableColumnCell>
        );

      return (
        <DataTableColumnCell className="justify-end">
          {formatDate(value, { locale })}
        </DataTableColumnCell>
      );
    },
  },
  {
    id: "actions",
    cell: function Component({ row: { original: r } }) {
      const { cmn } = useLocale();
      return (
        <div className="flex items-center justify-center">
          <DataTableRowActions>
            <FormAlertDialogButton
              trigger={{
                variant: "ghost",
                children: cmn["delete"],
                className:
                  "w-full justify-start px-2 text-start font-normal text-destructive hover:text-destructive",
              }}
              title="Are you absolutely sure?"
              description="This action cannot be undone. This will permanently delete your account and remove your data from our servers."
              form={{
                validation: "delete-product",
                onSubmit: deleteProduct,
                useForm: { defaultValues: { ...r } },
              }}
            />
          </DataTableRowActions>
        </div>
      );
    },
  },
];
