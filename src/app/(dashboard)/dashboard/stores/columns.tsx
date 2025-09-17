"use client";

import Image from "next/image";

import { useSortable } from "@dnd-kit/sortable";
import { IconGripVertical } from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";

import { deleteStore } from "@/servers/stores";
import { cn } from "@/lib/utils";
import { Validation } from "@/lib/validations";

import { Button } from "@/components/ui/button";
import { DataTableRowActions } from "@/components/ui/data-table";
import { FormAlertDialogButton } from "@/components/ui/form";
import { useLocale } from "@/components/locale-provider";

type Schema = Validation["store-schema"];
function DragHandle({ id }: Pick<Schema, "id">) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

export const columns: ColumnDef<Schema>[] = [
  {
    accessorKey: "name",
    header: "Store Details",
    cell: ({ row }) => (
      <div className="flex w-full flex-1 items-center gap-3">
        {row.original.logo && (
          <Image
            width={99999999}
            height={99999999}
            src={row.original.logo}
            alt={row.original.name}
            className="size-8 rounded border object-cover"
          />
        )}
        <div className="flex flex-col">
          <span className="truncate font-medium">{row.original.name}</span>
          <span className="text-muted-foreground truncate text-xs">
            {row.original.username}
          </span>
          {row.original.bio && (
            <span className="text-muted-foreground truncate text-xs">
              {row.original.bio}
            </span>
          )}
        </div>
      </div>
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
