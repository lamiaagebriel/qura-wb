import { cn } from "@/lib/shadcn";
import { NavItem } from "@/types";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Fragment } from "react";

export type BreadcrumbsProps = { items: NavItem[] };
export function Breadcrumbs({ items = [] }: BreadcrumbsProps) {
	return (
		<div className="container py-4">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<SidebarTrigger />
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					{items?.slice(0, -1)?.map((e, i) => (
						<Fragment key={i}>
							<BreadcrumbItem>
								<BreadcrumbLink href={e?.["value"]}>{e?.["label"]}</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
						</Fragment>
					))}

					{items?.slice(-1)?.map((e, i) => (
						<BreadcrumbItem key={i}>
							<BreadcrumbPage>{e?.["label"]}</BreadcrumbPage>
						</BreadcrumbItem>
					))}
				</BreadcrumbList>
			</Breadcrumb>
		</div>
	);
}
