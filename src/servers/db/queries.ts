import { db } from "@/servers/db";
import { unstable_cache } from "@/lib/utils";

export const queries = {
  stores: {
    get: unstable_cache(
      async ({ id }: { id: string }) => {
        const store = await db.query.stores.findFirst({
          where: (s, o) => o.eq(s?.["id"], id),
        });
        return { data: store };
      },
      ["stores"],
      { tags: ["stores"] }
    ),
    getMany: unstable_cache(
      async ({ userId }: { userId: string }) => {
        const stores = await db.query.stores.findMany({
          where: (s, o) => o.eq(s?.["userId"], userId),
          orderBy: (s, o) => o.desc(s?.["createdAt"]),
        });

        return { data: stores };
      },
      ["stores"],
      { tags: ["stores"] }
    ),
  },
};
