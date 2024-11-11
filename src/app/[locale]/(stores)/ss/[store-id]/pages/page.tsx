import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { promises as fs } from "fs";
import path from "path";
import { MDX } from "@/components/mdx";
import { MDXEditor } from "@/components/mdx-editor";

type DashboardProps = Readonly<{
	params: Promise<LocaleProps>;
}>;
export const metadata: Metadata = { title: "Dashboard" };
export default async function Dashboard({ params }: DashboardProps) {
	const { locale } = await params;
	const markdown = await fs.readFile(path.join(process.cwd(), "/src/app", "markdown.mdx"), "utf8");

	return (
		<div className="container max-w-screen-md py-6">
			<MDXEditor markdown={markdown} />
			{/* <MDX markdown={markdown} /> */}
		</div>
	);
}
