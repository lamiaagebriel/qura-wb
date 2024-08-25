import { z } from "@/lib/zod";

export const productSchema = z.object(
  // <Record<keyof Omit<Store, "createdAt">, any> >
  {
    id: z.stringRequired("id"),
    storeId: z.stringRequired("storeId"),
    name: z.stringRequired("name"),
    deletedAt: z.date("deleted at"),
  }
);

export const productCreateSchema = productSchema.pick({
  storeId: true,
  name: true,
});

export const productUpdateSchema = productSchema.pick({
  id: true,
  name: true,
});

export const productBinSchema = productSchema.pick({
  id: true,
  deletedAt: true,
});
export const productRestoreSchema = productSchema.pick({
  id: true,
  deletedAt: true,
});
export const productDeleteSchema = productSchema.pick({
  id: true,
});
