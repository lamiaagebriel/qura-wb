import { z } from "zod";

import { i18n } from "@/lib/locale";

export type Validation = keyof typeof validations;
export type ValidationInfer<T extends Validation> = z.infer<
  (typeof validations)[T]
>;
export const validations = {
  "locale-switcher": z.object({
    locale: z.enum(i18n?.["locales"]),
  }),
};
