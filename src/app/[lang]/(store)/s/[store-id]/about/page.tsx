import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";

type AboutProps = Readonly<{ params: Promise<{ "store-id": string } & LocaleProps> }>;
export const metadata: Metadata = { title: "About" };
export default async function About({ params }: AboutProps) {
	return <div className="container py-4">About</div>;
}
