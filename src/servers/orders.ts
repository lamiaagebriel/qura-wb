"use server";

import { RequiresLoginError, ZodError } from "@/servers/exceptions";
import {
  orderBinSchema,
  orderCreateSchema,
  orderDeleteSchema,
  orderUpdateSchema,
} from "@/validations/orders";
import { z } from "zod";

import { getAuth } from "@/lib/auth";
import { ID } from "@/lib/constants";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createOrder({
  products,
  ...data
}: z.infer<typeof orderCreateSchema>) {
  try {
    const { user } = await getAuth();
    if (!user) return { error: new RequiresLoginError() };

    const orderDetails = {
      ...data,
      id: ID.generate(),
      userId: user?.["id"],
      deletedAt: null,
    };

    await db.order.create({
      data: products?.["length"]
        ? {
            ...orderDetails,
            products: {
              createMany: {
                data: products?.map((p) => ({
                  ...p,
                  id: ID.generate(),
                })),
              },
            },
          }
        : {
            ...orderDetails,
          },
    });

    // TODO: revalidate using tags
    revalidatePath("/", "layout");
  } catch (error: any) {
    console.log(error?.["message"]);
    if (error instanceof z.ZodError) return { error: new ZodError(error) };

    return {
      error:
        error?.["message"] ?? "Your order was not created. Please try again.",
    };
  }
}

export async function updateOrder({
  id,
  products,
  ...data
}: z.infer<typeof orderUpdateSchema>) {
  try {
    const { user } = await getAuth();
    if (!user) return { error: new RequiresLoginError() };
    // TODO: authorization
    // if (user?.["id"] !== storeId) return { error: new RequiresAccessError() };

    await db.$transaction(async (tx) => {
      await tx.order.update({
        data: { ...data },
        where: { id },
      });

      // TODO: use products
      // await tx.orderProductDetails.updateMany({
      //   data: { ...data },
      //   where: { orderId: id },
      // });
    });
    revalidatePath("/", "layout");
  } catch (error: any) {
    console.log(error?.["message"]);
    if (error instanceof z.ZodError) return { error: new ZodError(error) };

    return {
      error:
        error?.["message"] ?? "Your order was not updated. Please try again.",
    };
  }
}

export async function updateOrderFeature({
  id,
  ...data
}: z.infer<typeof orderBinSchema>) {
  try {
    const { user } = await getAuth();
    if (!user) return { error: new RequiresLoginError() };
    // TODO: authorization
    // if (user?.["id"] !== storeId) return { error: new RequiresAccessError() };

    await db.order.update({
      data: { ...data },
      where: { id },
    });
    revalidatePath("/", "layout");
  } catch (error: any) {
    console.log(error?.["message"]);
    if (error instanceof z.ZodError) return { error: new ZodError(error) };

    return {
      error:
        error?.["message"] ?? "Your order was not updated. Please try again.",
    };
  }
}

export async function deleteOrder({ id }: z.infer<typeof orderDeleteSchema>) {
  try {
    const { user } = await getAuth();
    if (!user) return { error: new RequiresLoginError() };

    await db.order.delete({
      where: { id },
    });
    revalidatePath("/", "layout");
  } catch (error: any) {
    console.log(error?.["message"]);
    if (error instanceof z.ZodError) return { error: new ZodError(error) };

    return {
      error:
        error?.["message"] ?? "Your order was not deleted. Please try again.",
    };
  }
}
