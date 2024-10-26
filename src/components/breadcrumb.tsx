import {
	Breadcrumb as BreadcrumbWrapper,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SelectItem } from "@/types";
import { Fragment } from "react";

type BreadcrumbProps = {
	items: SelectItem[];
};
export function Breadcrumb({ items }: BreadcrumbProps) {
	if (!items?.["length"]) return null;

	const lastItem = items?.pop()!;

	return (
		<BreadcrumbWrapper>
			<BreadcrumbList>
				{items?.map((e, i) => (
					<Fragment key={i}>
						<BreadcrumbItem className="hidden md:block">
							<BreadcrumbLink href={e?.["value"]}>{e?.["label"]}</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator className="hidden md:block" />
					</Fragment>
				))}

				<BreadcrumbItem>
					<BreadcrumbPage>{lastItem?.["label"]}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</BreadcrumbWrapper>
	);
}
