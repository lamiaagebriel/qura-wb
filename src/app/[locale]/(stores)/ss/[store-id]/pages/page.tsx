import "@/styles/mdx.css";

import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { promises as fs } from "fs";
import path from "path";
import { MDX } from "@/components/mdx";

type DashboardProps = Readonly<{
	params: Promise<LocaleProps>;
}>;
export const metadata: Metadata = { title: "Dashboard" };
export default async function Dashboard({ params }: DashboardProps) {
	const { locale } = await params;
	const markdown = await fs.readFile(path.join(process.cwd(), "/src/app", "markdown.mdx"), "utf8");

	return (
		<article className="container relative max-w-3xl py-6 lg:py-10">
			<MDX markdown={markdown} />
			<hr className="mt-12" />
		</article>
	);
}
