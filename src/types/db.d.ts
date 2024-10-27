import { z } from "zod";
import { attributeSchema } from "@/validations/products";

export type ProductAttribute = z.infer<typeof attributeSchema>;
