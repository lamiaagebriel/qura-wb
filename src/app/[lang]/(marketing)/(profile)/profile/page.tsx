import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";

type ProfileProps = Readonly<{ params: Promise<{ "store-id": string } & LocaleProps> }>;
export const metadata: Metadata = { title: "Profile" };
export default async function Profile({ params }: ProfileProps) {
	return <div className="container py-4">Profile</div>;
}
