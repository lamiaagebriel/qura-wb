"use client";

import Image from "next/image";

import { Paths } from "@/constants";
import { ColumnDef } from "@tanstack/react-table";

import { deleteStore } from "@/servers/stores";
import { cn } from "@/lib/utils";
import { Validation } from "@/lib/validations";

import { Badge } from "@/components/ui/badge";
import { DataTableRowActions } from "@/components/ui/data-table";
import { FormAlertDialogButton } from "@/components/ui/form";
import { Link } from "@/components/ui/link";
import { useLocale } from "@/components/locale-provider";

type Schema = Validation["store-schema"];
export const columns: ColumnDef<Schema>[] = [
  {
    accessorKey: "name",
    header: "Store Details",
    cell: ({ row: { original: e } }) => (
      <div className="flex w-full flex-1 items-center gap-2">
        {e?.logo && (
          <Image
            width={99999999}
            height={99999999}
            src={e?.logo}
            alt={e?.name}
            className="size-12 rounded-full border object-cover"
          />
        )}
        <div className="flex flex-col">
          <Link
            href={`${Paths.DashboardStore}/${e?.id}`}
            className="truncate font-semibold hover:underline"
          >
            {e?.name}
          </Link>
          <p className="text-muted-foreground truncate text-xs">
            {e?.username}
          </p>
          {e?.bio && (
            <p className="text-muted-foreground line-clamp-1 max-w-sm truncate text-xs">
              {e?.bio}
            </p>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row: { original: e } }) => (
      <Badge variant="outline">{e?.status}</Badge>
    ),
  },
  // {
  //   accessorKey: "status",
  //   header: "Status",
  //   cell: ({ row }) => {
  //     return (
  //       <>
  //         <Label htmlFor={`${row.original.id}-status`} className="sr-only">
  //           Status
  //         </Label>
  //         <Select defaultValue={row.original.status}>
  //           <SelectTrigger
  //             className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
  //             size="sm"
  //             id={`${row.original.id}-status`}
  //           >
  //             <SelectValue placeholder="choose status" />
  //           </SelectTrigger>
  //           <SelectContent align="end">
  //             <SelectItem value="draft">
  //               <div className="flex items-center gap-2">
  //                 <IconLoader />
  //                 Draft
  //               </div>
  //             </SelectItem>
  //             <SelectItem value="live">
  //               <div className="flex items-center gap-2">
  //                 <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
  //                 Live
  //               </div>
  //             </SelectItem>
  //           </SelectContent>
  //         </Select>
  //       </>
  //     );
  //   },
  // },
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
                validation: "delete-store",
                onSubmit: deleteStore,
                useForm: { defaultValues: { ...e } },
              }}
            />
          </DataTableRowActions>
        </div>
      );
    },
  },
];
