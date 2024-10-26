"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dictionary } from "@/types/locale";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";

export type DataTableRowActionsProps = {
  children?: React.ReactNode;
} & Dictionary["data-table-row-actions"];

export function DataTableRowActions({
  dic: { "data-table-row-actions": c },
  children,
}: DataTableRowActionsProps) {
  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4 shrink-0" />
            <span className="sr-only">{c?.["open menu"]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-full min-w-40">
          <DropdownMenuLabel>{c?.["actions"]}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
