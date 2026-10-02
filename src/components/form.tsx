"use client";

// Form building blocks: shadcn's `Field` + React Hook Form's `Controller`,
// validated by a zod schema (`zodResolver`). Schema messages are
// translation keys (`MessageKey`); `FormError` shows them translated.
//
//   const form = useForm({ resolver: zodResolver(schema), defaultValues });
//   <TextField control={form.control} name="name.en" label={t("Name")} />

import { useState, type ComponentProps, type ReactNode } from "react";
import {
  Controller,
  get,
  useFormState,
  useWatch,
  type Control,
  type FieldError as RhfFieldError,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LOCALE_META, LOCALES, type Locale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

// 44px+ tall fields, 16px text (no zoom on focus) — like the rest of the app.
export const INPUT = "h-11 rounded-xl px-3 text-base md:text-base";

/** A field's error, translated (schema messages are `MessageKey`s). */
export function FormError({ error }: { error?: RhfFieldError }) {
  const { t } = useLocale();
  if (!error?.message) return null;
  return <FieldError>{t(error.message as MessageKey)}</FieldError>;
}

type FieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: ReactNode;
  description?: ReactNode;
};

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

/** A labelled multi-line text field bound to `name`. */
export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  ...props
}: FieldProps<T> & Omit<ComponentProps<"textarea">, "name" | "value">) {
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
              "min-h-24 resize-none rounded-xl px-3 text-base md:text-base",
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

const LANGUAGE_DIR = { en: "auto", ar: "rtl", fr: "ltr" } as const;

/**
 * Text written in several languages (`name` holds `{ en, ar, fr }`): one
 * input, with a language switch inside it. A dot on a language = written
 * (red when it has an error). `inputLabels` name each language's input
 * ("Name (Arabic, optional)") for screen readers.
 */
export function LocalizedField<T extends FieldValues>({
  control,
  name,
  label,
  inputLabels,
  multiline,
  action,
  maxLength,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: ReactNode;
  inputLabels: Record<Locale, string>;
  multiline?: boolean;
  /** A button beside the input (e.g. remove this row). */
  action?: ReactNode;
  maxLength?: number;
}) {
  const { t } = useLocale();
  const [lang, setLang] = useState<Locale>("en");
  const { errors } = useFormState({ control, name });
  const values = useWatch({ control, name }) as Record<Locale, string>;
  const errorOf = (l: Locale) =>
    get(errors, `${name}.${l}`) as RhfFieldError | undefined;
  const invalid = LOCALES.some((l) => errorOf(l));

  const switcher = (
    <ToggleGroup
      value={[lang]}
      onValueChange={(next) => next[0] && setLang(next[0] as Locale)}
      size="sm"
      spacing={0}
      dir="ltr"
    >
      {LOCALES.map((l) => (
        <ToggleGroupItem
          key={l}
          value={l}
          aria-label={LOCALE_META[l].label}
          // 44px tap area around a compact pill.
          className="relative h-8 gap-1 px-2 text-xs uppercase after:absolute after:-inset-y-1.5 after:inset-x-0"
        >
          {l}
          {(errorOf(l) || values?.[l]) && (
            <span
              aria-hidden
              className={cn(
                "size-1.5 rounded-full",
                errorOf(l) ? "bg-destructive" : "bg-primary",
              )}
            />
          )}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Controller
        // One input at a time: remounted for each language.
        key={lang}
        control={control}
        name={`${name}.${lang}` as FieldPath<T>}
        render={({ field, fieldState }) => {
          const shared = {
            ...field,
            id: name,
            "aria-label": inputLabels[lang],
            "aria-invalid": fieldState.invalid,
            dir: LANGUAGE_DIR[lang],
            lang,
            maxLength,
            autoComplete: "off",
          };
          return multiline ? (
            <InputGroup className="h-auto rounded-xl has-[textarea]:rounded-xl">
              <InputGroupTextarea
                {...shared}
                rows={3}
                className="min-h-24 px-3 text-base md:text-base"
              />
              <InputGroupAddon align="block-end" className="justify-end">
                {switcher}
              </InputGroupAddon>
            </InputGroup>
          ) : (
            <div className="flex gap-2">
              <InputGroup className="h-11 flex-1 rounded-xl">
                <InputGroupInput
                  {...shared}
                  enterKeyHint="next"
                  className="h-full px-3 text-base md:text-base"
                />
                <InputGroupAddon align="inline-end">{switcher}</InputGroupAddon>
              </InputGroup>
              {action}
            </div>
          );
        }}
      />
      {LOCALES.map((l) => {
        const error = errorOf(l);
        if (!error?.message) return null;
        const message = t(error.message as MessageKey);
        return (
          <FieldError key={l}>
            {l === lang ? message : `${LOCALE_META[l].label}: ${message}`}
          </FieldError>
        );
      })}
    </Field>
  );
}

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
            <InputGroupAddon className="ps-3 text-base">@</InputGroupAddon>
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
              className="h-full text-base md:text-base"
            />
          </InputGroup>
          <FormError error={fieldState.error} />
        </Field>
      )}
    />
  );
}
