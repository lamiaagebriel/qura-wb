"use server";

import { revalidateTag } from "next/cache";

import { Paths } from "@/constants";
import { db, orm, schema } from "@/db";
import { z } from "zod";

import { getDictionary } from "@/servers/locale";
import { createServerAction } from "@/servers/utils";
import { getAuth } from "@/lib/auth";
import { aws } from "@/lib/aws";
import { ID } from "@/lib/utils";
import { Validation, validations } from "@/lib/validations";

export const createStore = createServerAction(
  async (formData: Validation["create-store"]) => {
    const { logo: logoProp, ...data } =
      validations["create-store"]?.parse(formData);
    const { actions: c, cmn } = await getDictionary();

    const { user } = await getAuth();
    if (!user || !user?.id)
      throw new Error(c["this action needs you to be logged in."]);

    const isUsernameExists = await db.query.stores.findFirst({
      columns: { username: true },
      where: (s, o) => o.eq(s?.username, data?.username),
    });

    if (isUsernameExists)
      throw new z.ZodError([
        {
          code: "custom",
          path: ["username"],
          message: "this name has been used before.",
        },
      ]);

    const logo = logoProp
      ? await aws.upload(logoProp, { Key: `stores/logo-` })
      : null;

    const id = ID.generate();
    // Use a transaction to update the user's role to "merchant" in the users schema,
    // and insert the new store in the stores schema.
    await db.transaction(async (tx) => {
      // Update the user's role to "merchant"
      await tx
        .update(schema.users)
        .set({ role: "merchant" })
        .where(orm.eq(schema.users.id, user?.id));

      // Insert the new store
      await tx.insert(schema.stores).values({
        id,
        ...data,
        logo,
        ownerId: user?.id,
      });
    });

    revalidateTag("stores");
    return {
      ok: true,
      redirect: `${Paths.DashboardStore}/${id}`,
      toast: { type: "success", message: cmn["created successfully."] },
    };
  },
  { defaultMessage: "your store was not created. please try again." }
);

export const deleteStore = createServerAction(
  async (formData: Validation["delete-store"]) => {
    const data = validations["delete-store"]?.parse(formData);
    const { actions: c, cmn } = await getDictionary();

    const { user } = await getAuth();
    if (!user || !user?.id)
      throw new Error(c["this action needs you to be logged in."]);

    await db.transaction(async (tx) => {
      // Delete the targetted store
      await db
        .delete(schema.stores)
        .where(
          orm.and(
            orm.eq(schema.stores.id, data?.id),
            orm.eq(schema.stores.ownerId, user?.id)
          )
        )
        .then(async () => {
          if (data?.logo) await aws.delete(data?.logo);
          // TODO: delete also all product images relatted to that store from cloud
          // NOTE: to do so, let all images has the storeId in its path
        });

      // Check if the user has any more stores; if not, update role to "user"
      const remainingStores = await tx
        .select()
        .from(schema.stores)
        .where(orm.eq(schema.stores.ownerId, user?.id));

      if (remainingStores.length === 0) {
        await tx
          .update(schema.users)
          .set({ role: "user" })
          .where(orm.eq(schema.users.id, user?.id));
      }
    });

    revalidateTag("stores");
    return {
      ok: true,
      toast: { type: "success", message: cmn["deleted successfully."] },
    };
  },
  { defaultMessage: "your store was not deleted. please try again." }
);
