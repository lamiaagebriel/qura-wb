import { z as zod } from "zod";

import { i18n } from "@/lib/locale";
import { z } from "@/lib/zod";

export type ValidationName = keyof typeof validations;
export type Validation = {
  [K in ValidationName]: zod.infer<(typeof validations)[K]>;
};

export const validations = {
  "locale-switcher": z.object({ locale: z.enum(i18n?.locales) }),
};
