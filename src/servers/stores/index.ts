"use server";

import { storeCreateSchema } from "@/validations/stores";
import { z } from "zod";

import { getAuth } from "@/lib/lucia";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getLocale, handleError } from "@/servers/utils";
import { ID } from "@/constants/utils";
import { getDictionary } from "@/lib/locale";
import { uploadImages } from "@/lib/utils";

export async function createStore({ logo: logoProp, ...data }: z.infer<typeof storeCreateSchema>) {
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

		const logo = logoProp
			? ((
					await uploadImages({
						Key: `stores/logo-`, // maintain unique naming if needed
						images: [logoProp],
					})
				)?.pop() ?? null)
			: null;

		const id = ID.generate();
		await db.store.create({
			data: {
				...data,
				id,
				userId: user?.["id"],
				logo,
			},
		});

		revalidatePath("/", "layout");
		return { id };
	} catch (error: any) {
		return handleError({
			locale,
			error,
			message: c?.["your store was not created. please try again."],
		});
	}
}
