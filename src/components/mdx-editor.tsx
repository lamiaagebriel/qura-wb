"use client";
import "@mdxeditor/editor/style.css";
import {
	MDXEditor as MDXEditorComponent,
	type MDXEditorProps as MDXEditorComponentProps,
} from "@mdxeditor/editor";
import dynamic from "next/dynamic";
import { ALL_PLUGINS } from "@/lib/mdx/plugins";
import { cn } from "@/lib/utils";

type MDXEditorProps = {} & MDXEditorComponentProps;
function MDXEditorBase({ contentEditableClassName, ...props }: MDXEditorProps) {
	return (
		<MDXEditorComponent
			plugins={ALL_PLUGINS}
			contentEditableClassName={cn(
				"prose prose-invert prose-p:my-3 prose-p:leading-relaxed prose-headings:my-4 prose-blockquote:my-4 prose-ul:my-2 prose-li:my-0 prose-code:px-1 prose-code:text-red-500 prose-code:before:content-[''] prose-code:after:content-[''] max-w-none px-8 py-5 text-lg caret-yellow-500 outline-none",
				"min-h-60 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
				contentEditableClassName,
			)}
			{...props}
		/>
	);
}
export const MDXEditor = dynamic(() => Promise.resolve(MDXEditorBase), { ssr: false });
