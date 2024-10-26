import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Dictionary } from "@/types/locale";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
  EyeNoneIcon,
} from "@radix-ui/react-icons";
import { Column } from "@tanstack/react-table";

export type DataTableColumnHeaderProps<TData, TValue> = {
  title: string;
  column: Column<TData, TValue>;
} & React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> &
  Dictionary["data-table-column-header"];

export function DataTableColumnHeader<TData, TValue>({
  dic: { "data-table-column-header": c },
  title,
  column,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort())
    return (
      <div className={className} {...props}>
        {title}
      </div>
    );

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDownIcon className="h-4 w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : (
              <CaretSortIcon className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            className="gap-2"
            onClick={() => column.toggleSorting(false)}
          >
            <ArrowUpIcon className="h-3.5 w-3.5 text-muted-foreground/70" />
            {c?.["asc"]}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            onClick={() => column.toggleSorting(true)}
          >
            <ArrowDownIcon className="h-3.5 w-3.5 text-muted-foreground/70" />
            {c?.["desc"]}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2"
            onClick={() => column.toggleVisibility(false)}
          >
            <EyeNoneIcon className="h-3.5 w-3.5 text-muted-foreground/70" />
            {c?.["hide"]}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
