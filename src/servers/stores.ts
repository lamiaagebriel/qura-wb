"use server";

import { RequiresLoginError, ZodError } from "@/servers/exceptions";
import { storeCreateSchema } from "@/validations/stores";
import { z } from "zod";

import { getAuth } from "@/lib/auth";
import { ID } from "@/lib/constants";
import { db } from "@/lib/db";

export async function createStore(data: z.infer<typeof storeCreateSchema>) {
  try {
    const { user } = await getAuth();
    if (!user) throw new RequiresLoginError();

    const id = ID.generate();
    await db.store.create({
      data: {
        ...data,
        id,
        userId: user?.["id"],
      },
    });

    // TODO: revalidate
    // revalidateTag(TAGS.STORES);
  } catch (error: any) {
    console.log(error?.["message"]);
    if (error instanceof z.ZodError) return { error: new ZodError(error) };

    return {
      error:
        error?.["message"] ?? "Your store was not created. Please try again.",
    };
  }
}
