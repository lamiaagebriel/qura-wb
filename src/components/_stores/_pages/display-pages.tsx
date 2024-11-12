"use client";

import * as React from "react";
import { cn } from "@/lib/shadcn";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { StorePage } from "@/types/db";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MDX } from "@/components/mdx";
import { PageCreateButton, PageCreateButtonProps } from "./page-create-button";
import { Icons } from "@/components/icons";

type DisplayPagesProps = {
	pages: StorePage[];
} & Pick<PageCreateButtonProps, "dic" | "store">;

export function DisplayPages({ pages, ...props }: DisplayPagesProps) {
	const [selectedPage, SetSelectedPage] = React.useState<StorePage | null>(null);

	return (
		<ResizablePanelGroup direction="horizontal">
			<ResizablePanel maxSize={40}>
				<div className="container flex h-[45px] items-center justify-between gap-2 py-2">
					<div className="flex items-center gap-1">
						<SidebarTrigger />
						<h1 className="text-lg font-bold">Pages</h1>
					</div>

					<PageCreateButton className="w-fit" {...props} />
				</div>
				<Separator />
				<ScrollArea className="h-[calc(100svh-1rem-46px)] py-4">
					<div className="flex flex-col gap-2 p-4 pt-0">
						{pages?.map((e, i) => (
							<button
								key={i}
								className={cn(
									"flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
									selectedPage?.["url"] === e?.["url"] && "bg-muted",
								)}
								onClick={() => SetSelectedPage(e)}
							>
								<h1 className="flex items-center gap-2">
									<Icons.files />
									{e?.["title"]}
								</h1>
								<p className="line-clamp-2 text-xs text-muted-foreground">
									{e?.["description"]?.substring(0, 300)}
								</p>
							</button>
						))}
					</div>
				</ScrollArea>
			</ResizablePanel>
			<ResizableHandle withHandle />

			<ResizablePanel>
				<ScrollArea className="flex h-[calc(100svh-1rem)] flex-col">
					<div>
						{!selectedPage ? (
							<div>NO PAGE</div>
						) : (
							<div className="container max-w-screen-md py-4">
								{
									<React.Suspense fallback={<>loading...</>}>
										<MDX markdown={selectedPage?.["body"]!} />
									</React.Suspense>
								}
							</div>
						)}
					</div>
				</ScrollArea>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
