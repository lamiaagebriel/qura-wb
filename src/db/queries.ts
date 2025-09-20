import { db } from "@/db";

import { unstable_cache } from "@/lib/utils";
import { ProductStatus } from "@/lib/validations";

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
};
