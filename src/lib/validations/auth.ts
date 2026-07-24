import * as z from "zod";

import type { Dict } from "@/lib/i18n/config";

/**
 * All auth schemas are built as factory functions so error messages can be
 * localized — call them with the `t` function from `useLocale()` /
 * `getLocale()` and memoize with `useMemo` in client components.
 */
type Translate = (key: keyof Dict) => string;

export function createLoginSchema(t: Translate) {
  return z.object({
    email: z
      .string()
      .min(1, t("Please enter your email."))
      .email(t("Enter a valid email address.")),
    password: z.string().min(1, t("Please enter your password.")),
  });
}
export type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;

export function createSignupSchema(t: Translate) {
  return z.object({
    name: z.string().min(1, t("Please enter your full name.")),
    email: z
      .string()
      .min(1, t("Please enter your email."))
      .email(t("Enter a valid email address.")),
    password: z.string().min(8, t("Password must be at least 8 characters.")),
  });
}
export type SignupValues = z.infer<ReturnType<typeof createSignupSchema>>;

export function createForgotPasswordSchema(t: Translate) {
  return z.object({
    email: z
      .string()
      .min(1, t("Please enter your email."))
      .email(t("Enter a valid email address.")),
  });
}
export type ForgotPasswordValues = z.infer<
  ReturnType<typeof createForgotPasswordSchema>
>;

export function createResetPasswordSchema(t: Translate) {
  return z
    .object({
      password: z
        .string()
        .min(8, t("Password must be at least 8 characters.")),
      confirmPassword: z.string().min(1, t("Please confirm your password.")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("Passwords don't match."),
      path: ["confirmPassword"],
    });
}
export type ResetPasswordValues = z.infer<
  ReturnType<typeof createResetPasswordSchema>
>;
