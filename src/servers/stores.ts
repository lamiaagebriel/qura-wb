"use server";

import { revalidateTag } from "next/cache";

import { ID } from "@/constants/utils";
import { z } from "zod";

import { db, schema } from "@/servers/db";
import { getDictionary } from "@/servers/locale";
import { createServerAction } from "@/servers/utils";
import { getAuth } from "@/lib/auth";
import { aws } from "@/lib/aws";
import { Validation, validations } from "@/lib/validations";

export const createStore = createServerAction(
  async (formData: Validation["create-store"]) => {
    const { logo: logoProp, ...data } =
      validations?.["create-store"]?.parse(formData);
    const { actions: c, cmn } = await getDictionary();

    const { user } = await getAuth();
    if (!user || !user?.["id"])
      throw new Error(c?.["this action needs you to be logged in."]);

    const isUsernameExists = await db.query.stores.findFirst({
      columns: { username: true },
      where: (s, o) => o.eq(s?.["username"], data?.["username"]),
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
      ? ((await aws.uploadImages([logoProp], { Key: `stores/logo-` }))?.pop() ??
        null)
      : null;

    const id = ID.generate();
    await db.insert(schema?.["stores"]).values({
      id,
      ...data,
      logo,
      userId: user?.["id"],
    });

    revalidateTag("stores");
    return {
      ok: true,
      redirect: `/ss/${id}`,
      toast: { type: "success", message: cmn?.["created successfully."] },
    };
  },
  { defaultMessage: "your store was not created. please try again." }
);
