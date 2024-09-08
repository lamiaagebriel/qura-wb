import { z } from "@/lib/zod";

export const orderSchema = z.object(
  // <Record<keyof Omit<Order, "createdAt">, any>>
  {
    id: z.stringRequired("id"),
    storeId: z.stringRequired("storeId"),
    userId: z.stringRequired("userId"),
    deletedAt: z.date("deleted at"),
    status: z.enum(["PENDING", "CONFIRMED", "DELIVERING", "DELIVERED"]),
    products: z.array(
      z.object(
        //  <Record<keyof Omit<OrderProductDetails, "createdAt" | "orderId" | "id">, any>>
        {
          productId: z.stringRequired("productId"),
          size: z.stringRequired("size"),
          color: z.stringRequired("color"),
        }
      )
    ),
  }
);

export const orderCreateSchema = orderSchema.pick({
  storeId: true,
  products: true,
});

export const orderUpdateSchema = orderSchema.pick({
  id: true,
  products: true,
});

export const orderBinSchema = orderSchema.pick({
  id: true,
  deletedAt: true,
});
export const orderRestoreSchema = orderSchema.pick({
  id: true,
  deletedAt: true,
});
export const orderDeleteSchema = orderSchema.pick({
  id: true,
});
