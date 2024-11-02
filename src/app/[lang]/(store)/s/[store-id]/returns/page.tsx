import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";

type ReturnsProps = Readonly<{ params: Promise<{ "store-id": string } & LocaleProps> }>;
export const metadata: Metadata = { title: "Returns" };
export default async function Returns({ params }: ReturnsProps) {
	return <div className="container py-4">Returns</div>;
}
