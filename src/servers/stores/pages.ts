"use server";

import { pageCreateSchema } from "@/validations/stores/pages";
import { z } from "zod";

import { getAuth } from "@/lib/lucia";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getLocale, handleError } from "@/servers/utils";
import { getDictionary } from "@/lib/locale";

export async function createPage({ storeId, ...data }: z.infer<typeof pageCreateSchema>) {
	const locale = await getLocale();
	const { actions: c } = await getDictionary({ locale });

	try {
		const { user } = await getAuth();
		if (!user)
			return handleError({
				locale,
				error: null,
				message: c?.["this action needs you to be logged in."],
			});

		await db.store.update({
			data: {
				pages: { push: { ...data } },
			},
			where: { id: storeId },
		});

		revalidatePath("/", "layout");
	} catch (error: any) {
		return handleError({
			locale,
			error,
			message: c?.["your page was not created. please try again."],
		});
	}
}
