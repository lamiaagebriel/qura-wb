"use server";

import { pageCreateSchema } from "@/validations/pages";
import { z } from "zod";

import { getAuth } from "@/lib/lucia";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getLocale, handleError } from "@/servers/utils";
import { getDictionary } from "@/lib/locale";
import { ID } from "@/constants/utils";

export async function createPage({ ...data }: z.infer<typeof pageCreateSchema>) {
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

		await db.page.create({
			data: {
				id: ID.generate(),
				...data,
			},
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
