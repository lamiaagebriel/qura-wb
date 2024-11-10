import { StoreCreateSteps } from "@/components/_stores/store-create-steps";
import { getDictionary } from "@/lib/locale";
import { getAuth } from "@/lib/lucia";
import { db } from "@/lib/prisma";
import { LocaleProps } from "@/types/locale";
import { redirect } from "next/navigation";

type CreateFirstStoreProps = Readonly<{
	params: Promise<LocaleProps>;
}>;

export default async function CreateFirstStore({ params }: CreateFirstStoreProps) {
	const { locale } = await params;
	const { user } = await getAuth();
	if (!user) redirect(`/${locale}/login`);

	const stores = await db.store.findMany({ where: { userId: user?.["id"] } });
	if (stores?.["length"]) redirect(`/${locale}/dashboard`);

	const dic = await getDictionary({ locale });

	return (
		<div className="flex flex-col items-center justify-center">
			<div className="container max-w-screen-sm">
				<StoreCreateSteps
					dic={dic}
					className="flex min-h-screen flex-col justify-between gap-10 py-8"
				/>
			</div>
		</div>
	);
}
