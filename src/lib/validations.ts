import { z as zod } from "zod";

import { i18n } from "@/lib/locale";
import { z } from "@/lib/zod";

export const userSchema = z.object({
  id: z.stringRequired("id"),
  name: z.stringRequired("name"),
  image: z.stringRequired("image"),
  email: z.stringRequired("email").email("invalid email."),
  password: z.password("password"),
});

export type ValidationName = keyof typeof validations;
export type Validation = {
  [K in ValidationName]: zod.infer<(typeof validations)[K]>;
};
export const validations = {
  "locale-switcher": z.object({ locale: z.enum(i18n?.["locales"]) }),
  "login-with-password-schema": userSchema.pick({
    email: true,
    password: true,
  }),
  "register-with-password-schema": userSchema.pick({
    email: true,
    password: true,
  }),
  "verify-email-schema": z.object({ code: z.stringRequired("code") }),
  "send-password-reset-link-schema": userSchema.pick({ email: true }),
  "reset-password-schema": userSchema.pick({ password: true }).and(
    z.object({
      confirmPassword: z.stringRequired("confirm password"),
      token: z.stringRequired("token"),
    })
  ),
};
