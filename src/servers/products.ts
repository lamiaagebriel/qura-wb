"use server";

import { revalidateTag } from "next/cache";

import { ID } from "@/constants/utils";

import { db, schema } from "@/servers/db";
import { getDictionary } from "@/servers/locale";
import { createServerAction } from "@/servers/utils";
import { getAuth } from "@/lib/auth";
import { Validation, validations } from "@/lib/validations";

export const createProduct = createServerAction(
  async (formData: Validation["create-product"]) => {
    const data = validations?.["create-product"]?.parse(formData);
    const { actions: c, "form-fields": ff } = await getDictionary();

    const { user } = await getAuth();
    if (!user) throw new Error(c?.["this action needs you to be logged in."]);

    const id = ID.generate();
    await db.insert(schema?.["products"]).values({
      id,
      ...data,
      slug: `slug-${Date.now()}`,
      title: "Untitled Product",
    });

    revalidateTag("products");
    return {
      ok: true,
      redirect: `/ss/${data?.storeId}/products/${id}`,
      toast: { type: "success", message: ff?.["created successfully."] },
    };
  },
  { defaultMessage: "your product was not created. please try again." }
);
