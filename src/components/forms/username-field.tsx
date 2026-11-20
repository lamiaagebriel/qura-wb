"use client";

import { Controller, type FieldValues } from "react-hook-form";

import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { FormError, type FieldProps } from "@/components/forms/form-error";

/**
 * An @handle: lowercase as you type (handles are lowercase), no
 * autocorrect, with "@" in front. Left-to-right in every language.
 */
export function UsernameField<T extends FieldValues>({
  control,
  name,
  label,
}: Omit<FieldProps<T>, "description">) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <InputGroup dir="ltr" className="h-11 rounded-xl">
            <InputGroupAddon className="ps-3">@</InputGroupAddon>
            <InputGroupInput
              {...field}
              onChange={(event) =>
                field.onChange(event.target.value.toLowerCase())
              }
              id={name}
              aria-invalid={fieldState.invalid}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="off"
              enterKeyHint="next"
              maxLength={30}
              className="h-full"
            />
          </InputGroup>
          <FormError error={fieldState.error} />
        </Field>
      )}
    />
  );
}
