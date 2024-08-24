"use server";

import {
  RequiresAccessError,
  RequiresLoginError,
  ZodError,
} from "@/servers/exceptions";
import {
  storeBinSchema,
  storeCreateSchema,
  storeDeleteSchema,
  storeUpdateSchema,
} from "@/validations/stores";
import { z } from "zod";

import { getAuth } from "@/lib/auth";
import { ID } from "@/lib/constants";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createStore(data: z.infer<typeof storeCreateSchema>) {
  try {
    const { user } = await getAuth();
    if (!user) return { error: new RequiresLoginError() };

    const id = ID.generate();
    await db.store.create({
      data: {
        ...data,
        id,
        userId: user?.["id"],
        deletedAt: null,
      },
    });

    // TODO: revalidate using tags s
    revalidatePath("/", "layout");
  } catch (error: any) {
    console.log(error?.["message"]);
    if (error instanceof z.ZodError) return { error: new ZodError(error) };

    return {
      error:
        error?.["message"] ?? "Your store was not created. Please try again.",
    };
  }
}

export async function updateStore({
  id,
  userId,
  ...data
}: z.infer<typeof storeUpdateSchema> | z.infer<typeof storeBinSchema>) {
  try {
    const { user } = await getAuth();
    if (!user) return { error: new RequiresLoginError() };
    if (user?.["id"] !== userId) return { error: new RequiresAccessError() };

    await db.store.update({
      data: { ...data },
      where: { id },
    });
    revalidatePath("/", "layout");
  } catch (error: any) {
    console.log(error?.["message"]);
    if (error instanceof z.ZodError) return { error: new ZodError(error) };

    return {
      error:
        error?.["message"] ?? "Your store was not updated. Please try again.",
    };
  }
}

export async function deleteStore({
  id,
  userId,
}: z.infer<typeof storeDeleteSchema>) {
  try {
    const { user } = await getAuth();
    if (!user) return { error: new RequiresLoginError() };
    if (user?.["id"] !== userId) return { error: new RequiresAccessError() };

    await db.store.delete({
      where: {
        id,
      },
    });
    revalidatePath("/", "layout");
  } catch (error: any) {
    console.log(error?.["message"]);
    if (error instanceof z.ZodError) return { error: new ZodError(error) };

    return {
      error:
        error?.["message"] ?? "Your store was not deleted. Please try again.",
    };
  }
}
