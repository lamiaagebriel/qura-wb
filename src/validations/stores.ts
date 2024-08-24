import { z } from "@/lib/zod";

export const storeSchema = z.object(
  // <Record<keyof Omit<Store, "createdAt">, any> >
  {
    id: z.stringRequired("id"),
    userId: z.stringRequired("userId"),
    name: z.stringRequired("name"),
    deletedAt: z.date("deleted at"),
  }
);

export const storeCreateSchema = storeSchema.pick({
  name: true,
});

export const storeUpdateSchema = storeSchema.pick({
  id: true,
  userId: true,
  name: true,
});

export const storeBinSchema = storeSchema.pick({
  id: true,
  userId: true,
  deletedAt: true,
});
export const storeRestoreSchema = storeSchema.pick({
  id: true,
  userId: true,
  deletedAt: true,
});
export const storeDeleteSchema = storeSchema.pick({
  id: true,
  userId: true,
});
