import { db } from "@/db";

import { unstable_cache } from "@/lib/utils";
import { OrderStatus, ProductStatus } from "@/lib/validations";

export const queries = {
  stores: {
    get: unstable_cache(
      async ({ id }: { id: string }) => {
        const store = await db.query.stores.findFirst({
          where: (s, o) => o.eq(s?.id, id),
        });
        return { data: store };
      },
      ["stores"],
      { tags: ["stores"] }
    ),
    getMany: unstable_cache(
      async ({ ownerId }: { ownerId?: string }) => {
        const stores = await db.query.stores.findMany({
          where: (s, o) => (ownerId ? o.eq(s?.ownerId, ownerId) : undefined),
          orderBy: (s, o) => o.desc(s?.createdAt),
        });

        return { data: stores };
      },
      ["stores"],
      { tags: ["stores"] }
    ),
  },

  products: {
    get: unstable_cache(
      async ({ id }: { id: string }) => {
        const product = await db.query.products.findFirst({
          where: (s, o) => o.eq(s?.id, id),
        });
        return { data: product };
      },
      ["products"],
      { tags: ["products"] }
    ),
    getMany: unstable_cache(
      async ({
        storeId,
        status,
      }: {
        storeId: string;
        status?: ProductStatus;
      }) => {
        const products = await db.query.products.findMany({
          where: (s, o) =>
            o.and(
              o.eq(s?.storeId, storeId),
              status ? o.eq(s?.status, status) : undefined
            ),
          orderBy: (s, o) => o.desc(s?.createdAt),
        });

        return { data: products };
      },
      ["products"],
      { tags: ["products"] }
    ),
  },
  users: {
    get: unstable_cache(
      async ({ id }: { id: string }) => {
        const user = await db.query.users.findFirst({
          where: (s, o) => o.eq(s?.id, id),
          columns: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        });
        return { data: user };
      },
      ["users"],
      { tags: ["users"] }
    ),
    getMany: unstable_cache(
      async ({ ids }: { ids: string[] }) => {
        const users = await db.query.users.findMany({
          where: (s, o) => o.inArray(s?.id, ids),
          columns: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        });
        return { data: users };
      },
      ["users"],
      { tags: ["users"] }
    ),
  },
  orders: {
    get: unstable_cache(
      async ({ id }: { id: string }) => {
        const order = await db.query.orders.findFirst({
          where: (s, o) => o.eq(s?.id, id),
        });
        return { data: order };
      },
      ["orders"],
      { tags: ["orders"] }
    ),
    getMany: unstable_cache(
      async ({
        storeId,
        userId,
        status,
      }: {
        storeId?: string;
        userId?: string;
        status?: OrderStatus;
      }) => {
        const orders = await db.query.orders.findMany({
          where: (s, o) =>
            o.and(
              status ? o.eq(s?.status, status) : undefined,
              storeId ? o.eq(s?.storeId, storeId) : undefined,
              userId ? o.eq(s?.userId, userId) : undefined
            ),
          orderBy: (s, o) => o.desc(s?.createdAt),
        });

        return { data: orders };
      },
      ["orders"],
      { tags: ["orders"] }
    ),
  },
};
