import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";
import { getDictionary } from "@/lib/locale";

import { getAuth } from "@/lib/lucia";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LocaleLink } from "@/components/links";

type DashboardProps = Readonly<{
	params: Promise<LocaleProps>;
}>;
export const metadata: Metadata = { title: "Dashboard" };
export default async function Dashboard({ params }: DashboardProps) {
	const { locale } = await params;
	const dic = await getDictionary({ locale });
	const { user } = await getAuth();
	if (!user) redirect(`/${locale}/login`);

	const stores = await db.store.findMany({ where: { userId: user?.["id"] } });
	if (!stores?.["length"]) redirect(`/${locale}/create-store`);

	return (
		<div className="flex min-h-screen flex-col">
			<div className="container grid max-w-screen-md grid-cols-3 gap-2 py-4">
				{stores.map((e, i) => (
					<Card key={i}>
						<LocaleLink href={`/ss/${e?.["id"]}`}>
							<CardHeader>
								<CardTitle>{e?.["name"]}</CardTitle>
							</CardHeader>
						</LocaleLink>
					</Card>
				))}
			</div>
		</div>
	);
}
