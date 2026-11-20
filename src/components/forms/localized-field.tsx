"use client";

import { useState, type ReactNode } from "react";
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

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LOCALE_META, LOCALES, type Locale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

const LANGUAGE_DIR = { en: "auto", ar: "rtl" } as const;

/**
 * Text written in several languages (`name` holds `{ en, ar }`, at least one written): one
 * input, with a language switch inside it. A dot on a language = written
 * (red when it has an error). `inputLabels` name each language's input
 * ("Name (Arabic)") for screen readers.
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
