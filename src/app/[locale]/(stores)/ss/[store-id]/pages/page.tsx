import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";
import { promises as fs } from "fs";
import path from "path";
import { db } from "@/lib/prisma";
import { PageCreateSteps } from "@/components/_stores/_pages/page-create-steps";
import { getDictionary } from "@/lib/locale";
import { StorePage } from "@/types/db";
import { DisplayPages } from "@/components/_stores/_pages/display-pages";

type StorePagesProps = Readonly<{
	params: Promise<{ "store-id": string } & LocaleProps>;
}>;
export const metadata: Metadata = { title: "Store Pages" };
export default async function StorePages({ params }: StorePagesProps) {
	const { locale, "store-id": storeId } = await params;
	const markdown = await fs.readFile(path.join(process.cwd(), "/src/app", "markdown.mdx"), "utf8");
	const dic = await getDictionary({ locale });
	const r = (await db.store.findUnique({ select: { pages: true }, where: { id: storeId } }))?.[
		"pages"
	];
	if (!r || !r?.["length"] || !Array.isArray(r))
		return (
			<div className="flex flex-1 flex-col items-center justify-center">
				<div className="container max-w-screen-sm">
					<br />
					<PageCreateSteps
						dic={dic}
						store={{ id: storeId }}
						className="flex flex-col justify-between gap-10 py-8"
					/>
				</div>
			</div>
		);

	const pages = (r as StorePage[])?.map((e) => ({ ...e, body: markdown }));

	return <DisplayPages dic={dic} store={{ id: storeId }} pages={pages} />;
}
