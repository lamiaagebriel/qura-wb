import { Store } from "@prisma/client";
import { ZodString } from "zod";

import { z } from "@/lib/zod";

export const storeSchema = z.object<
  Record<keyof Omit<Store, "createdAt">, ZodString>
>({
  id: z.stringRequired("id"),
  userId: z.stringRequired("userId"),
  name: z.stringRequired("name"),
});

export const storeCreateSchema = storeSchema.pick({
  name: true,
});
