"use client";

import { Paths } from "@/constants";
import { getOrderNumbers } from "@/stores/cart-store";
import { ColumnDef } from "@tanstack/react-table";

import { deleteOrder } from "@/servers/orders";
import { cn, formatPrice } from "@/lib/utils";
import { OrderPaymentMethod, Validation } from "@/lib/validations";

import { Badge } from "@/components/ui/badge";
import { DataTableRowActions } from "@/components/ui/data-table";
import { FormAlertDialogButton } from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
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
    cell: function Cell({ row: { original: e } }) {
      const {
        db: { orders: oo },
      } = useLocale();
      const pp = e?.actions?.find((e) => e?.action?.startsWith("paying__"));
      const t =
        oo["actions"]["action"]["enums"]?.[pp?.action as OrderPaymentMethod];

      return <span>{t?.label}</span>;
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row: { original: e } }) => {
      const { subtotal, total, discountAmount, deliveryFee } = getOrderNumbers({
        products: e?.items ?? [],
        discount: e?.discount ?? undefined,
        shippingFee: e?.address?.[0]?.shipping,
      });

      return <span className="font-mono">{formatPrice(total)}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: function Cell({ row: { original: e } }) {
      const {
        db: { orders: dbOrder },
      } = useLocale();

      const statusEnum = dbOrder?.status?.enums?.[e?.status];
      const orderStatusLabel = statusEnum?.label ?? e.status;
      const orderStatusColor = statusEnum?.color;
      return (
        <Badge variant="outline">
          <Icons.dot style={{ backgroundColor: orderStatusColor }} />{" "}
          {orderStatusLabel}
        </Badge>
      );
    },
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
    cell: function Cell({ row: { original: e } }) {
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
