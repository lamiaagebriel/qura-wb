"use client";

import { Paths } from "@/constants";
import { ColumnDef } from "@tanstack/react-table";

import { deleteOrder } from "@/servers/orders";
import { cn } from "@/lib/utils";
import { OrderPaymentMethod, Validation } from "@/lib/validations";

import { Badge } from "@/components/ui/badge";
import { DataTableRowActions } from "@/components/ui/data-table";
import { FormAlertDialogButton } from "@/components/ui/form";
import { Link } from "@/components/ui/link";
import { useLocale } from "@/components/locale-provider";

type OrderSchema = Validation["order-schema"]; // You'll need to define this order schema in your validation library

export const columns: ColumnDef<OrderSchema>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order ID",
    cell: ({ row: { original: e } }) => (
      <Link
        href={`${Paths.DashboardStore}/${e?.storeId}${Paths.DashboardStoreOrders}/${e?.id}`}
        className="truncate font-semibold hover:underline"
      >
        {e?.id}
      </Link>
    ),
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row: { original: e } }) => (
      <div className="flex flex-col">
        <span className="font-medium">{e?.address?.[0]?.name}</span>
        <span className="text-muted-foreground truncate text-xs">
          {e?.address?.[0]?.phones?.[0]}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "actions.0.action",
    header: "Payment Method",
    cell: ({ row: { original: e } }) => {
      const {
        db: { orders: oo },
      } = useLocale();
      const pp = e?.actions?.find((e) => e?.action?.startsWith("paying__"));
      console.log({ pp, a: e?.actions });

      const t =
        oo["actions"]["action"]["enums"]?.[pp?.action as OrderPaymentMethod];

      return <span>{t?.label}</span>;
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row: { original: e } }) => {
      // Calculate total: sum of item prices * quantity + shipping - discount
      // Calculate the total price based on attributes for each item
      const itemsTotal = Array.isArray(e.items)
        ? e.items.reduce((sum, item) => {
            // If item has attributes (array), sum the price*quantity for each attribute
            if (Array.isArray(item.attributes) && item.attributes.length > 0) {
              return (
                sum +
                item.attributes.reduce((attrSum, attr) => {
                  const attrPrice = Number(attr.price) || 0;
                  const attrQty = Number(attr.quantity) || 0;
                  return attrSum + attrPrice * attrQty;
                }, 0)
              );
            }
            // fallback: try item.price/item.quantity if present at item level
            const price = Number((item as any).price) || 0;
            const qty = Number((item as any).quantity) || 0;
            return sum + price * qty;
          }, 0)
        : 0;
      const shipping = Number(e.expenses?.shipping) || 0;
      const discount = Number(e.expenses?.discount) || 0;
      const total = itemsTotal + shipping - discount;

      return (
        <span className="font-mono">
          {total.toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
          })}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row: { original: e } }) => (
      <Badge variant="outline">{e?.status}</Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row: { original: e } }) => (
      <span>
        {e?.createdAt ? new Date(e.createdAt).toLocaleDateString() : ""}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row: { original: e } }) => {
      const { cmn } = useLocale();

      return (
        <div className="flex w-full items-center justify-end">
          <DataTableRowActions>
            <FormAlertDialogButton
              data-variant="destructive"
              trigger={{
                variant: "none",
                children: cmn["delete"],
                className: cn(
                  "w-full justify-start px-2 text-start font-normal",
                  "text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 hover:text-destructive *:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                ),
              }}
              title={cmn["are you absolutely sure?"]}
              description={
                cmn[
                  "this action cannot be undone. this will permanently delete your account and remove your data from our servers."
                ]
              }
              form={{
                validation: "delete-order",
                onSubmit: deleteOrder,
                useForm: { defaultValues: { ...e } },
              }}
            />
          </DataTableRowActions>
        </div>
      );
    },
  },
];
