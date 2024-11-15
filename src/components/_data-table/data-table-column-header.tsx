import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/shadcn";
import { Dictionary } from "@/types/locale";
// import {
//   ArrowDownIcon,
//   ArrowUpIcon,
//   CaretSortIcon,
//   EyeNoneIcon,
// } from "@radix-ui/react-icons";
import { Column } from "@tanstack/react-table";
import { Icons } from "@/components/icons";
import { EyeClosed } from "lucide-react";

export type DataTableColumnHeaderProps<TData, TValue> = {
	title: string;
	column: Column<TData, TValue>;
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> &
	Dictionary["data-table-column-header"];

export function DataTableColumnHeader<TData, TValue>({
	dic: { "data-table-column-header": c },
	title,
	column,
	className,
	...props
}: DataTableColumnHeaderProps<TData, TValue>) {
	if (!column.getCanSort() && !column.getCanHide())
		return (
			<div className={cn("flex items-center justify-center gap-2", className)} {...props}>
				<Button variant="ghost" size="sm" className="hover:bg-transparent">
					<span>{title}</span>
				</Button>
			</div>
		);

	return (
		<div className={cn("flex items-center justify-center gap-2", className)} {...props}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" className="gap-2 data-[state=open]:bg-accent">
						<span>{title}</span>
						{column.getIsSorted() === "desc" ? (
							<Icons.arrowLeft />
						) : column.getIsSorted() === "asc" ? (
							<Icons.arrowUp />
						) : (
							<Icons.arrowUpDown />
						)}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					{column.getCanSort() ? (
						<>
							<DropdownMenuItem className="gap-2" onClick={() => column.toggleSorting(false)}>
								<Icons.arrowUp className="size-3.5 text-muted-foreground/70" />
								{c?.["asc"]}
							</DropdownMenuItem>
							<DropdownMenuItem className="gap-2" onClick={() => column.toggleSorting(true)}>
								<Icons.arrowDown className="size-3.5 text-muted-foreground/70" />
								{c?.["desc"]}
							</DropdownMenuItem>
							{column.getCanHide() ? <DropdownMenuSeparator className="last:hidden" /> : null}
						</>
					) : null}
					{column.getCanHide() ? (
						<DropdownMenuItem className="gap-2" onClick={() => column.toggleVisibility(false)}>
							<EyeClosed className="size-3.5 text-muted-foreground/70" />
							{c?.["hide"]}
						</DropdownMenuItem>
					) : null}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
