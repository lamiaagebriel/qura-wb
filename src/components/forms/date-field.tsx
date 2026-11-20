"use client";

import { Controller, type FieldValues } from "react-hook-form";

import { FormError, type FieldProps } from "@/components/forms/form-error";
import { DatePicker } from "@/components/date-picker";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

/** A form date ("YYYY-MM-DD", "" = none): a calendar, or the native wheel on iOS (see `DatePicker`). */
export function DateField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  min,
  max,
  placeholder,
}: FieldProps<T> & { min?: string; max?: string; placeholder?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <DatePicker
            id={name}
            value={field.value ?? ""}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={field.disabled}
            min={min}
            max={max}
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FormError error={fieldState.error} />
        </Field>
      )}
    />
  );
}
