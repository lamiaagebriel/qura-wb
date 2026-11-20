"use client";

import { Controller, type FieldValues } from "react-hook-form";

import { FormError, type FieldProps } from "@/components/forms/form-error";
import { Select, type SelectOption } from "@/components/select";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { useLocale } from "@/lib/i18n/provider";

/** A form select: shadcn's Select, or the native picker on iOS (see `Select`). */
export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  options,
}: FieldProps<T> & { options: SelectOption[] }) {
  const { t } = useLocale();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Select
            id={name}
            name={field.name}
            value={field.value ?? ""}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={field.disabled}
            aria-invalid={fieldState.invalid}
            // A form that brings its own "" option keeps it.
            options={
              options.some((o) => o.value === "")
                ? options
                : [{ value: "", label: t("Choose"), disabled: true }, ...options]
            }
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FormError error={fieldState.error} />
        </Field>
      )}
    />
  );
}
