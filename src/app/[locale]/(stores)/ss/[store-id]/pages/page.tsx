import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";
import { promises as fs } from "fs";
import path from "path";
import { db } from "@/lib/prisma";
import { PageCreateSteps } from "@/components/_pages/page-create-steps";
import { getDictionary } from "@/lib/locale";
import { StorePage } from "@/types/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { cn } from "@/lib/shadcn";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MDX } from "@/components/mdx";
import { PageCreateButton } from "@/components/_pages/page-create-button";
import { Icons } from "@/components/icons";

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

	const pages = [
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
		...(r as StorePage[])?.map((e) => ({ ...e, body: markdown })),
	];
	return (
		<Tabs defaultValue="0">
			<ResizablePanelGroup direction="horizontal">
				<ResizablePanel maxSize={20} className="flex flex-col">
					<div className="container flex items-center justify-between gap-2 py-2">
						<div className="flex items-center gap-1">
							<SidebarTrigger />
							<h1 className="text-lg font-bold">Pages</h1>
						</div>

						<div>
							<PageCreateButton dic={dic} store={{ id: storeId }} />
						</div>
					</div>
					<Separator />

					<ScrollArea className="h-[calc(100svh-1rem-54px)]">
						<TabsList className="flex h-full flex-col justify-start rounded-none">
							{pages?.map((e, i) => (
								<TabsTrigger
									key={i}
									value={`${i}`}
									className="flex flex-col items-start justify-start"
								>
									<h1 className="flex items-center justify-start gap-2">
										<Icons.files />
										{e?.["title"]}
									</h1>

									<p className="line-clamp-2 max-w-prose text-wrap text-start text-xs text-muted-foreground">
										{e?.["description"]} Lorem ipsum dolor, sit amet consectetur adipisicing elit.
										Fugit impedit eaque exercitationem quos expedita? Vero repudiandae unde cum iste
										architecto, ex molestiae officia impedit tempora dicta voluptatem reprehenderit
										labore ratione.
									</p>
								</TabsTrigger>
							))}
						</TabsList>
					</ScrollArea>
				</ResizablePanel>
				<ResizableHandle withHandle />

				<ResizablePanel>
					<ScrollArea className="h-[calc(100svh-1rem)]">
						{pages?.map((e, i) => (
							<TabsContent key={i} value={`${i}`} className="container max-w-screen-md py-4">
								<div className="grid gap-2">
									<MDX markdown={e?.["body"]} />
								</div>
							</TabsContent>
						))}
					</ScrollArea>
				</ResizablePanel>
			</ResizablePanelGroup>
		</Tabs>
	);
}
