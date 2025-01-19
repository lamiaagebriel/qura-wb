"use server";

import { revalidateTag } from "next/cache";

import { ID } from "@/constants/utils";

import { db, orm, schema } from "@/servers/db";
import { getDictionary } from "@/servers/locale";
import { createServerAction } from "@/servers/utils";
import { getAuth } from "@/lib/auth";
import { aws } from "@/lib/aws";
import { Validation, validations } from "@/lib/validations";

export const createProduct = createServerAction(
  async (formData: Validation["create-product"]) => {
    const data = validations?.["create-product"]?.parse(formData);
    const { actions: c, cmn } = await getDictionary();

    const { user } = await getAuth();
    if (!user) throw new Error(c?.["this action needs you to be logged in."]);

    const id = ID.generate();
    await db.insert(schema?.products).values({
      id,
      ...data,
      slug: `slug-${Date.now()}`,
      title: "Untitled Product",
    });

    revalidateTag("products");
    return {
      ok: true,
      redirect: `/ss/${data?.storeId}/products/${id}`,
      toast: { type: "success", message: cmn?.["created successfully."] },
    };
  },
  { defaultMessage: "your product was not created. please try again." }
);

export const updateProduct = createServerAction(
  async (formData: Validation["update-product"]) => {
    const {
      id,
      images: _images,
      oldValues,
      ...data
    } = validations?.["update-product"]?.parse(formData);
    const { actions: c, cmn } = await getDictionary();

    const { user } = await getAuth();
    if (!user || !id)
      throw new Error(c?.["this action needs you to be logged in."]);

    const images = _images?.length
      ? await aws.uploadMany(_images, { Key: `products/images-` })
      : [];

    await db
      .update(schema?.products)
      .set({ ...data, images, stock: Number(data?.stock) })
      .where(orm?.eq(schema?.products?.id, id));

    const deletedImages = oldValues?.images?.filter(
      (e) => !images?.includes(e)
    );
    if (deletedImages?.length) await aws.deleteMany(deletedImages);

    revalidateTag("products");
    return {
      ok: true,
      toast: { type: "success", message: cmn?.["updated successfully."] },
    };
  },
  { defaultMessage: "your product was not updated. please try again." }
);

export const deleteProduct = createServerAction(
  async (formData: Validation["delete-product"]) => {
    const data = validations?.["delete-product"]?.parse(formData);
    const { actions: c, cmn } = await getDictionary();

    const { user } = await getAuth();
    if (!user) throw new Error(c?.["this action needs you to be logged in."]);

    await db
      .delete(schema?.products)
      .where(orm?.eq(schema?.products?.id, data?.id));

    revalidateTag("products");
    return {
      ok: true,
      redirect: `/ss/${data?.storeId}/products`,
      toast: { type: "success", message: cmn?.["deleted successfully."] },
    };
  },
  { defaultMessage: "your product was not deleted. please try again." }
);
