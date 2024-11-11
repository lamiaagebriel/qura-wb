"use client";

import "@mdxeditor/editor/style.css";
import React from "react";
import {
	AdmonitionDirectiveDescriptor,
	directivesPlugin,
	frontmatterPlugin,
	headingsPlugin,
	imagePlugin,
	linkDialogPlugin,
	linkPlugin,
	listsPlugin,
	quotePlugin,
	tablePlugin,
	thematicBreakPlugin,
	toolbarPlugin,
	SandpackConfig,
	UndoRedo,
	BoldItalicUnderlineToggles,
	CodeToggle,
	StrikeThroughSupSubToggles,
	ListsToggle,
	BlockTypeSelect,
	CreateLink,
	InsertImage,
	InsertTable,
	InsertThematicBreak,
	InsertAdmonition,
	InsertFrontmatter,
	MDXEditor as MDXEditorComponent,
	type MDXEditorProps as MDXEditorComponentProps,
} from "@mdxeditor/editor";

import dynamic from "next/dynamic";
import { cn } from "@/lib/shadcn";

type MDXEditorProps = {} & MDXEditorComponentProps;
function MDXEditorBase({ contentEditableClassName, ...props }: MDXEditorProps) {
	return (
		<MDXEditorComponent
			plugins={ALL_PLUGINS}
			contentEditableClassName={cn(
				"prose prose-invert max-w-none px-8 py-5 text-lg caret-yellow-500 outline-none prose-headings:my-4 prose-p:my-3 prose-p:leading-relaxed prose-blockquote:my-4 prose-code:px-1 prose-code:text-red-500 prose-code:before:content-[''] prose-code:after:content-[''] prose-ul:my-2 prose-li:my-0",
				"w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
				contentEditableClassName,
			)}
			{...props}
		/>
	);
}
export const MDXEditor = dynamic(() => Promise.resolve(MDXEditorBase), { ssr: false });

async function expressImageUploadHandler(image: File) {
	const formData = new FormData();
	formData.append("image", image);
	const response = await fetch("/uploads/new", { method: "POST", body: formData });
	const json = (await response.json()) as { url: string };
	return json.url;
}

const ALL_PLUGINS = [
	toolbarPlugin({
		toolbarContents: () => (
			<>
				<UndoRedo />
				<BlockTypeSelect />
				<BoldItalicUnderlineToggles />
				<ListsToggle />
				<CodeToggle />
				<StrikeThroughSupSubToggles />
				<CreateLink /> <InsertImage />
				<InsertTable /> <InsertThematicBreak /> <InsertAdmonition /> <InsertFrontmatter />
				{/* <KitchenSinkToolbar /> */}
			</>
		),
	}),
	listsPlugin(),
	quotePlugin(),
	headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
	linkPlugin(),
	linkDialogPlugin(),
	imagePlugin({
		// imageAutocompleteSuggestions: [
		// 	"https://via.placeholder.com/150",
		// 	"https://via.placeholder.com/150",
		// ],
		imageUploadHandler: async () => Promise.resolve("https://picsum.photos/200/300"),
	}),
	tablePlugin(),
	thematicBreakPlugin(),
	frontmatterPlugin(),
	directivesPlugin({
		directiveDescriptors: [AdmonitionDirectiveDescriptor],
	}),
	// diffSourcePlugin({ viewMode: "rich-text", diffMarkdown: "boo" }),
	// markdownShortcutPlugin(),
];
