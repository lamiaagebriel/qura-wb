"use server";

import { orderCreateSchema, orderDeleteSchema, orderUpdateSchema } from "@/validations/orders";
import { z } from "zod";

import { getAuth } from "@/lib/lucia";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getLocale, handleError } from "@/servers/utils";
import { ID } from "@/constants/utils";
import { getDictionary } from "@/lib/locale";

export async function createOrder({ ...data }: z.infer<typeof orderCreateSchema>) {
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

		const id = ID.generate();
		await db.order.create({
			data: {
				...data,
				id,
				userId: user?.["id"],
			},
		});

		revalidatePath("/", "layout");
		return { id };
	} catch (error: any) {
		return handleError({
			locale,
			error,
			message: c?.["your order was not created. please try again."],
		});
	}
}

export async function deleteOrder({ id }: z.infer<typeof orderDeleteSchema>) {
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

		await db.order.delete({
			where: { id, userId: user?.["id"] },
		});
		revalidatePath("/", "layout");
	} catch (error: any) {
		return handleError({
			locale,
			error,
			message: c?.["your order was not deleted. please try again."],
		});
	}
}
