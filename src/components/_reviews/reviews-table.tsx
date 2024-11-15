"use client";

import { DataTable, DataTableProps, DataTableColumnHeader } from "@/components/_data-table";
import { Store, Review, User, Product } from "@prisma/client";
import { Dictionary } from "@/types/locale";
import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/shadcn";
import { Badge } from "../ui/badge";

type ColumnType = Review & { user: User; product: Product };
type ReviewsTableProps = {
	data: ColumnType[];
	store: Pick<Store, "id">;
} & Pick<DataTableProps<any, any>, "dic"> &
	Dictionary["reviews-table"];

export function ReviewsTable({ dic: { "reviews-table": c, ...dic }, data }: ReviewsTableProps) {
	return (
		<DataTable
			dic={dic}
			data={data}
			columns={
				[
					{
						accessorKey: "productId",
						header: ({ column }) => (
							<DataTableColumnHeader
								dic={dic}
								column={column}
								title={c?.["product"]}
								className="justify-start"
							/>
						),
						cell: ({ row: { original: r } }) => (
							<div className="flex items-center gap-2 text-start">
								<Avatar>
									<AvatarImage src={r?.["product"]?.["images"]?.[0]!} alt="" />
									<AvatarFallback text={r?.["product"]?.["name"]!}>
										<Icons.user />
									</AvatarFallback>
								</Avatar>
								<div>
									<h2>{r?.["product"]?.["name"]}</h2>
									<div className="flex items-center gap-3">
										{(r?.["product"]?.["attributes"] as any[])?.map((e, i) => (
											<div key={i} className="flex items-start gap-1">
												<h1 className="font-medium">{e?.["name"]}: </h1>
												<p className="text-sm text-muted-foreground">{`[${e?.["values"]?.[0]?.["name"]}]`}</p>
											</div>
										))}
									</div>
								</div>
							</div>
						),
					},
					{
						accessorKey: "userId",
						header: ({ column }) => (
							<DataTableColumnHeader
								dic={dic}
								column={column}
								title={c?.["customer"]}
								className="justify-start"
							/>
						),
						cell: ({ row: { original: r } }) => (
							<div className="flex items-center gap-2 text-start">
								<Avatar>
									<AvatarImage src={r?.["user"]?.["image"]!} alt="" />
									<AvatarFallback text={r?.["user"]?.["name"]!}>
										<Icons.user />
									</AvatarFallback>
								</Avatar>
								<div>
									<h2>{r?.["user"]?.["name"]}</h2>
									<p className="text-xs text-muted-foreground">{r?.["user"]?.["email"]}</p>
								</div>
							</div>
						),
					},
					{
						accessorKey: "rating",
						header: ({ column }) => (
							<DataTableColumnHeader
								dic={dic}
								column={column}
								title={c?.["rating details"]}
								className="justify-start"
							/>
						),
						cell: ({ row: { original: r } }) => (
							<div className="flex items-start gap-2">
								<div>
									<Badge variant="outline" className="flex items-center gap-1">
										<Icons.star
											className={cn(
												"size-3",
												r?.["rating"] >= 1 && "fill-yellow-400 stroke-yellow-400",
											)}
										/>
										<Icons.star
											className={cn(
												"size-3",
												r?.["rating"] >= 2 && "fill-yellow-400 stroke-yellow-400",
											)}
										/>
										<Icons.star
											className={cn(
												"size-3",
												r?.["rating"] >= 3 && "fill-yellow-400 stroke-yellow-400",
											)}
										/>
										<Icons.star
											className={cn(
												"size-3",
												r?.["rating"] >= 4 && "fill-yellow-400 stroke-yellow-400",
											)}
										/>
										<Icons.star
											className={cn(
												"size-3",
												r?.["rating"] >= 5 && "fill-yellow-400 stroke-yellow-400",
											)}
										/>
									</Badge>
								</div>
								<p className="line-clamp-1 max-w-prose text-sm">{r?.["content"]}</p>
							</div>
						),
					},
					{
						accessorKey: "createdAt",
						header: ({ column }) => (
							<DataTableColumnHeader dic={dic} column={column} title={c?.["createdAt"]} />
						),
						cell: ({ row: { original: r } }) => (
							<div className="flex items-center justify-center">
								<div className="flex items-center gap-2">
									{new Date(r?.["createdAt"]!)?.toLocaleString()}
								</div>
							</div>
						),
					},
				] as ColumnDef<ColumnType>[]
			}
		/>
	);
}
