import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";

type FAQsProps = Readonly<{ params: Promise<{ "store-id": string } & LocaleProps> }>;
export const metadata: Metadata = { title: "FAQs" };
export default async function FAQs({ params }: FAQsProps) {
	return <div className="container py-4">FAQs</div>;
}
