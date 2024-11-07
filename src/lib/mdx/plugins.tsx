import React from "react";
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { LeafDirective } from "mdast-util-directive";
import {
	diffSourcePlugin,
	markdownShortcutPlugin,
	AdmonitionDirectiveDescriptor,
	DirectiveDescriptor,
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
	codeBlockPlugin,
	codeMirrorPlugin,
	sandpackPlugin,
	KitchenSinkToolbar,
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
	DirectiveNode,
	usePublisher,
	DialogButton,
	insertDirective$,
} from "@mdxeditor/editor";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

const defaultSnippetContent = `
export default function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
    </div>
  );
}
`.trim();

export const virtuosoSampleSandpackConfig: SandpackConfig = {
	defaultPreset: "react",
	presets: [
		{
			label: "React",
			name: "react",
			meta: "live react",
			sandpackTemplate: "react",
			sandpackTheme: "light",
			snippetFileName: "/App.js",
			snippetLanguage: "jsx",
			initialSnippetContent: defaultSnippetContent,
		},
		{
			label: "React",
			name: "react",
			meta: "live",
			sandpackTemplate: "react",
			sandpackTheme: "light",
			snippetFileName: "/App.js",
			snippetLanguage: "jsx",
			initialSnippetContent: defaultSnippetContent,
		},
		{
			label: "Virtuoso",
			name: "virtuoso",
			meta: "live virtuoso",
			sandpackTemplate: "react-ts",
			sandpackTheme: "light",
			snippetFileName: "/App.tsx",
			initialSnippetContent: defaultSnippetContent,
			dependencies: {
				"react-virtuoso": "latest",
				"@ngneat/falso": "latest",
			},
			// files: {
			// 	"/data.ts": dataCode,
			// },
		},
	],
};

export async function expressImageUploadHandler(image: File) {
	const formData = new FormData();
	formData.append("image", image);
	const response = await fetch("/uploads/new", { method: "POST", body: formData });
	const json = (await response.json()) as { url: string };
	return json.url;
}

interface YoutubeDirectiveNode extends LeafDirective {
	name: "youtube";
	attributes: { id: string };
}

const YoutubeDirectiveDescriptor: DirectiveDescriptor<YoutubeDirectiveNode> = {
	name: "youtube",
	type: "leafDirective",
	testNode(node) {
		return node.name === "youtube";
	},
	attributes: ["id"],
	hasChildren: false,
	Editor: ({ mdastNode, lexicalNode, parentEditor }) => {
		return (
			<div className="relative">
				<Button
					variant="destructive"
					size="icon"
					className="absolute -right-2 -top-2 size-6 rounded-full"
					onClick={() => {
						parentEditor.update(() => {
							lexicalNode.selectNext();
							lexicalNode.remove();
						});
					}}
				>
					<Icons.x />
				</Button>

				<iframe
					className="aspect-video w-full max-w-60"
					src={`https://www.youtube.com/embed/${mdastNode.attributes.id}`}
					title="YouTube video player"
					frameBorder="0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				></iframe>
			</div>
		);
	},
};
const YouTubeButton = () => {
	// grab the insertDirective action (a.k.a. publisher) from the
	// state management system of the directivesPlugin
	const insertDirective = usePublisher(insertDirective$);

	return (
		<DialogButton
			tooltipTitle="Insert Youtube video"
			submitButtonTitle="Insert video"
			dialogInputPlaceholder="Paste the youtube video URL"
			buttonContent="YT"
			onSubmit={(url) => {
				const videoId = new URL(url).searchParams.get("v");
				if (videoId) {
					insertDirective({
						name: "youtube",
						type: "leafDirective",
						attributes: { id: videoId },
						children: [],
					} as LeafDirective);
				} else {
					alert("Invalid YouTube URL");
				}
			}}
		/>
	);
};

export const ALL_PLUGINS = [
	toolbarPlugin({
		toolbarContents: () => (
			<>
				<UndoRedo />
				<BoldItalicUnderlineToggles />
				<CodeToggle />
				<StrikeThroughSupSubToggles />
				<ListsToggle />
				<BlockTypeSelect />
				<CreateLink /> <InsertImage />
				<YouTubeButton />
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
		imageAutocompleteSuggestions: [
			"https://via.placeholder.com/150",
			"https://via.placeholder.com/150",
		],
		imageUploadHandler: async () => Promise.resolve("https://picsum.photos/200/300"),
	}),
	tablePlugin(),
	thematicBreakPlugin(),
	frontmatterPlugin(),
	// codeBlockPlugin({ defaultCodeBlockLanguage: "" }),
	// sandpackPlugin({ sandpackConfig: virtuosoSampleSandpackConfig }),
	// codeMirrorPlugin({
	// 	codeBlockLanguages: {
	// 		js: "JavaScript",
	// 		css: "CSS",
	// 		txt: "Plain Text",
	// 		tsx: "TypeScript",
	// 		"": "Unspecified",
	// 	},
	// }),
	directivesPlugin({
		directiveDescriptors: [YoutubeDirectiveDescriptor, AdmonitionDirectiveDescriptor],
	}),
	// diffSourcePlugin({ viewMode: "rich-text", diffMarkdown: "boo" }),
	// markdownShortcutPlugin(),
];
