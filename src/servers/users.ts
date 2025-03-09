"use server";

import { revalidateTag } from "next/cache";

import { db, orm, schema } from "@/servers/db";
import { getDictionary } from "@/servers/locale";
import { createServerAction } from "@/servers/utils";
import { getAuth } from "@/lib/auth";
import { aws } from "@/lib/aws";
import { Validation, validations } from "@/lib/validations";

export const updateUser = createServerAction(
  async (formData: Validation["update-user"]) => {
    const {
      id,
      image: _image,
      ...data
    } = validations["update-user"]?.parse(formData);
    const { actions: c, cmn } = await getDictionary();

    const { user } = await getAuth();
    if (!user || !id)
      throw new Error(c["this action needs you to be logged in."]);

    const image =
      _image && _image?.includes("base64")
        ? await aws.upload(_image, { Key: `users/image-` })
        : null;

    await db
      .update(schema?.users)
      .set({ ...data, image })
      .where(orm?.eq(schema?.users?.id, id));

    revalidateTag("users");
    return {
      ok: true,
      toast: { type: "success", message: cmn["updated successfully."] },
    };
  },
  { defaultMessage: "your user account was not updated. please try again." }
);
