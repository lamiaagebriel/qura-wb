import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";

type StoreProps = Readonly<{
	params: Promise<{ "store-id": string } & LocaleProps>;
}>;
export const metadata: Metadata = { title: "Store" };
export default async function Store({ params }: StoreProps) {
	return (
		<>
			<div className="container">Dashboard</div>
		</>
	);
}
