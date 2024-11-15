"use server";

import { reviewCreateSchema } from "@/validations/reviews";
import { z } from "zod";

import { getAuth } from "@/lib/lucia";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getLocale, handleError } from "@/servers/utils";
import { getDictionary } from "@/lib/locale";
import { ID } from "@/constants/utils";

export async function createReview({ ...data }: z.infer<typeof reviewCreateSchema>) {
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

		await db.review.create({
			data: {
				id: ID.generate(),
				...data,
				userId: user?.["id"],
			},
		});

		revalidatePath("/", "layout");
	} catch (error: any) {
		return handleError({
			locale,
			error,
			message: c?.["your review was not created. please try again."],
		});
	}
}
