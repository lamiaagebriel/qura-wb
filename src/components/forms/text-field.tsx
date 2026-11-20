"use client";

import { type ComponentProps } from "react";
import { Controller, type FieldValues } from "react-hook-form";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FormError, INPUT, type FieldProps } from "@/components/forms/form-error";

/** A labelled text input bound to `name`, with its error below. */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  ...props
}: FieldProps<T> & Omit<ComponentProps<"input">, "name" | "value">) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input
            {...field}
            id={name}
            aria-invalid={fieldState.invalid}
            className={cn(INPUT, className)}
            {...props}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FormError error={fieldState.error} />
        </Field>
      )}
    />
  );
}
