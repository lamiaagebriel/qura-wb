"use client";

// Form building blocks, one field per file in this folder: shadcn's `Field`
// + React Hook Form's `Controller`, validated by the form's zod schema
// (`lib/validations/`). Schema messages are translation keys (`MessageKey`);
// `FormError` shows them translated. Forms submit with `useActionForm`.
//
//   const { form, submit, pending, t } = useActionForm({ schema, defaultValues, action, onDone });
//   <TextField control={form.control} name="name.en" label={t("Name")} />

import type { ReactNode } from "react";
import {
  type Control,
  type FieldError as RhfFieldError,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { FieldError } from "@/components/ui/field";
import { useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/types";

// 44px+ tall fields, 16px text (no zoom on focus) — like the rest of the app.
export const INPUT = "h-11 rounded-xl px-3 text-base md:text-base";

/** A field's error, translated (schema messages are `MessageKey`s). */
export function FormError({ error }: { error?: RhfFieldError }) {
  const { t } = useLocale();
  if (!error?.message) return null;
  return <FieldError>{t(error.message as MessageKey)}</FieldError>;
}

// `R`: the values after validation, when the schema transforms them.
export type FieldProps<T extends FieldValues, R extends FieldValues = T> = {
  control: Control<T, unknown, R>;
  name: FieldPath<T>;
  label: ReactNode;
  description?: ReactNode;
};
