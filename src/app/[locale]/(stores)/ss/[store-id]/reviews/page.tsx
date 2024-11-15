import type { Metadata } from "next";

import { getDictionary } from "@/lib/locale";
import { LocaleProps } from "@/types/locale";
import { Breadcrumbs } from "@/components/ss/breadcrumbs";
import { Icons } from "@/components/icons";
import { db } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewsTable } from "@/components/_reviews/reviews-table";
import { ReviewCreateButton } from "@/components/_reviews/review-create-button";

type ReviewsProps = Readonly<{
	params: Promise<{ "store-id": string } & LocaleProps>;
}>;
export const metadata: Metadata = { title: "Reviews" };
export default async function Reviews({ params }: ReviewsProps) {
	const { locale, "store-id": storeId } = await params;
	const dic = await getDictionary({ locale });
	const c = dic?.["ss"]?.["store"]?.["reviews"];
	const reviews = await db.review.findMany({
		include: { user: true, product: true },
		where: { product: { storeId } },
	});
	const product = await db.product.findFirst();

	const tabs = [
		{
			value: "all",
			label: c?.["tabs"]?.["all"],
			reviews: reviews,
		},
		// {
		// 	value: "ACTIVE",
		// 	label: c?.["tabs"]?.["active"],
		// 	reviews: reviews?.filter((e) => e?.["status"] == "ACTIVE"),
		// },
		// {
		// 	value: "DRAFT",
		// 	label: c?.["tabs"]?.["draft"],
		// 	reviews: reviews?.filter((e) => e?.["status"] == "DRAFT"),
		// },
		// {
		// 	value: "ARCHIVE",
		// 	label: c?.["tabs"]?.["archive"],
		// 	reviews: reviews?.filter((e) => e?.["status"] == "ARCHIVE"),
		// },
	];

	return (
		<div>
			<Breadcrumbs items={[{ segments: [], value: "", label: c?.["reviews"] }]} />
			<div className="container flex items-center justify-between gap-2">
				<div>
					<h1 className="flex items-center gap-2 text-2xl font-semibold">
						<Icons.shirt className="size-5" />
						{c?.["reviews"]}
					</h1>
					<p className="max-w-prose text-sm text-muted-foreground">
						{c?.["browse all reviews, edit, and filter."]}
					</p>
				</div>
				<div>
					<ReviewCreateButton dic={dic} product={{ id: product?.["id"]! }} />
				</div>
			</div>

			<div className="container py-4">
				<Tabs defaultValue="all">
					<TabsList className="mb-4 h-fit justify-start rounded-none border-b bg-transparent p-0 rtl:flex-row-reverse">
						{tabs?.map((e, i) => (
							<TabsTrigger
								key={i}
								value={e?.["value"]}
								className="w-fit rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
							>
								{e?.["label"]} {e?.["reviews"]?.["length"]}
							</TabsTrigger>
						))}
					</TabsList>

					{tabs?.map((e, i) => (
						<TabsContent key={i} value={e?.["value"]}>
							<ReviewsTable dic={dic} data={e?.["reviews"]} store={{ id: storeId }} />
						</TabsContent>
					))}
				</Tabs>
			</div>
		</div>
	);
}
