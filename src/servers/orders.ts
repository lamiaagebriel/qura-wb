"use server";

import { revalidateTag } from "next/cache";

import { Paths } from "@/constants";
import { db, orm, schema } from "@/db";

import { getDictionary } from "@/servers/locale";
import { createServerAction } from "@/servers/utils";
import { getAuth } from "@/lib/auth";
import { ID } from "@/lib/utils";
import { Validation, validations } from "@/lib/validations";

export const checkOrderInfo = createServerAction(
  async (formData: Validation["check-order-info"]) => {
    const { storeId, ...data } =
      validations["check-order-info"]?.parse(formData);
    const { actions: c } = await getDictionary();

    console.log({ data });
    return {
      ok: true,
      redirect: `${Paths.Store}/${storeId}${Paths.StoreCheckoutShipping}`,
    };
  },
  { defaultMessage: "your order was not created. please try again." }
);

export const checkOrderShipping = createServerAction(
  async (formData: Validation["check-order-shipping"]) => {
    const { storeId, ...data } =
      validations["check-order-shipping"]?.parse(formData);
    const { actions: c } = await getDictionary();

    console.log({ data });
    return {
      ok: true,
      redirect: `${Paths.Store}/${storeId}${Paths.StoreCheckoutPayment}`,
    };
  },
  { defaultMessage: "your order was not created. please try again." }
);

export const checkOrderPayment = createServerAction(
  async (formData: Validation["check-order-payment"]) => {
    const { storeId, ...data } =
      validations["check-order-payment"]?.parse(formData);
    const { actions: c } = await getDictionary();

    console.log({ data });
    return {
      ok: true,
      redirect: `${Paths.Store}/${storeId}${Paths.StoreCheckoutReview}`,
    };
  },
  { defaultMessage: "your order was not created. please try again." }
);

export const createOrder = createServerAction(
  async (formData: Validation["create-order"]) => {
    const data = validations["create-order"]?.parse(formData);
    const { actions: c, cmn } = await getDictionary();

    const { user } = await getAuth();
    if (!user) throw new Error(c["this action needs you to be logged in."]);

    const id = ID.generate();
    const order = await db
      .insert(schema?.orders)
      .values({ id, ...data })
      .returning();

    revalidateTag("orders");
    return {
      ok: true,
      redirect: `${Paths.Dashboard}`,
      toast: { type: "success", message: cmn["created successfully."] },
      data: { order },
    };
  },
  { defaultMessage: "your order was not created. please try again." }
);

export const updateOrder = createServerAction(
  async (formData: Validation["update-order"]) => {
    const { id, ...data } = validations["update-order"]?.parse(formData);
    const { actions: c, cmn } = await getDictionary();

    const { user } = await getAuth();
    if (!user || !id)
      throw new Error(c["this action needs you to be logged in."]);

    await db
      .update(schema?.orders)
      .set({ ...data })
      .where(orm?.eq(schema?.orders?.id, id));

    revalidateTag("orders");
    return {
      ok: true,
      toast: { type: "success", message: cmn["updated successfully."] },
    };
  },
  { defaultMessage: "your order was not updated. please try again." }
);

export const deleteOrder = createServerAction(
  async (formData: Validation["delete-order"]) => {
    const data = validations["delete-order"]?.parse(formData);
    const { actions: c, cmn } = await getDictionary();

    const { user } = await getAuth();
    if (!user) throw new Error(c["this action needs you to be logged in."]);

    await db
      .delete(schema?.orders)
      .where(orm?.eq(schema?.orders?.id, data?.id));

    revalidateTag("orders");
    return {
      ok: true,
      toast: { type: "success", message: cmn["deleted successfully."] },
    };
  },
  { defaultMessage: "your order was not deleted. please try again." }
);
