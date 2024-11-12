import { pageSchema } from "@/validations/stores/pages";
import { attributeSchema } from "@/validations/products/attributes";
import { z } from "zod";

export type StorePage = z.infer<typeof pageSchema>;
export type ProductAttribute = z.infer<typeof attributeSchema>;
