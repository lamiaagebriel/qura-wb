"use server";

import { RequiresLoginError, ZodError } from "@/servers/exceptions";
import {
  productBinSchema,
  productCreateSchema,
  productDeleteSchema,
  productUpdateSchema,
} from "@/validations/products";
import { z } from "zod";

import { getAuth } from "@/lib/auth";
import { ID } from "@/lib/constants";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createProduct(data: z.infer<typeof productCreateSchema>) {
  try {
    const { user } = await getAuth();
    if (!user) return { error: new RequiresLoginError() };

    const id = ID.generate();
    await db.product.create({
      data: {
        ...data,
        id,
        deletedAt: null,
      },
    });

    // TODO: revalidate using tags
    revalidatePath("/", "layout");
  } catch (error: any) {
    console.log(error?.["message"]);
    if (error instanceof z.ZodError) return { error: new ZodError(error) };

    return {
      error:
        error?.["message"] ?? "Your product was not created. Please try again.",
    };
  }
}

export async function updateProduct({
  id,
  ...data
}: z.infer<typeof productUpdateSchema> | z.infer<typeof productBinSchema>) {
  try {
    const { user } = await getAuth();
    if (!user) return { error: new RequiresLoginError() };
    // TODO: authorization
    // if (user?.["id"] !== storeId) return { error: new RequiresAccessError() };

    await db.product.update({
      data: { ...data },
      where: { id },
    });
    revalidatePath("/", "layout");
  } catch (error: any) {
    console.log(error?.["message"]);
    if (error instanceof z.ZodError) return { error: new ZodError(error) };

    return {
      error:
        error?.["message"] ?? "Your product was not updated. Please try again.",
    };
  }
}

export async function deleteProduct({
  id,
}: z.infer<typeof productDeleteSchema>) {
  try {
    const { user } = await getAuth();
    if (!user) return { error: new RequiresLoginError() };

    await db.product.delete({
      where: { id },
    });
    revalidatePath("/", "layout");
  } catch (error: any) {
    console.log(error?.["message"]);
    if (error instanceof z.ZodError) return { error: new ZodError(error) };

    return {
      error:
        error?.["message"] ?? "Your product was not deleted. Please try again.",
    };
  }
}
