import { pageSchema } from "@/validations/pages";
import { attributeSchema } from "@/validations/products";
import { z } from "zod";

export type StorePage = z.infer<typeof pageSchema>;
export type ProductAttribute = z.infer<typeof attributeSchema>;
