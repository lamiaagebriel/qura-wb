"use client";

import { type ComponentProps } from "react";
import { Controller, type FieldValues } from "react-hook-form";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FormError, type FieldProps } from "@/components/forms/form-error";

/** A labelled multi-line text field bound to `name`. */
export function TextareaField<
  T extends FieldValues,
  R extends FieldValues = T,
>({
  control,
  name,
  label,
  description,
  className,
  ...props
}: FieldProps<T, R> & Omit<ComponentProps<"textarea">, "name" | "value">) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Textarea
            {...field}
            id={name}
            aria-invalid={fieldState.invalid}
            className={cn(
              "min-h-24 resize-none rounded-xl px-3",
              className,
            )}
            {...props}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FormError error={fieldState.error} />
        </Field>
      )}
    />
  );
}
