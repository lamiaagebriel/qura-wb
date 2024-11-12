import { pageSchema } from "@/validations/stores/pages";
import { z } from "zod";

export type StorePage = z.infer<typeof pageSchema>;
