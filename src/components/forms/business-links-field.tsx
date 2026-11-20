"use client";


import { useState } from "react";
import {
  Controller,
  useFieldArray,
  useFormState,
  type Control,
} from "react-hook-form";

import { FormError, INPUT } from "@/components/forms/form-error";
import { HugeiconsIcon } from "@/components/icons";
import { ActionSheet } from "@/components/sheets/action-sheet";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Field, FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/types";
import { SOCIAL_PLATFORMS } from "@/lib/socials";
import { cn } from "@/lib/utils";
import {
  isNumberPlatform,
  LINK_PLATFORMS,
  type BusinessFormValues,
  type LinkPlatform,
} from "@/lib/validations/business-form";

import { AddButton, JOINED, RemoveButton } from "@/components/forms/joined-row";

type Form = Control<BusinessFormValues>;

// What each kind of entry types: a number (WhatsApp, phone) or a web link.
const NUMBER_INPUT = {
  type: "tel",
  inputMode: "tel",
  autoComplete: "tel",
  placeholder: "+20 100 123 4567",
} as const;
const LINK_INPUT = {
  type: "url",
  inputMode: "url",
  autoComplete: "url",
  placeholder: "instagram.com/yourname",
} as const;

/**
 * WhatsApp, phone numbers, website and social accounts — one list, one
 * line each: the kind's icon (tap to change it), the number or link, and
 * remove. At least one WhatsApp (customers order there).
 */
export function LinkFields({ control }: { control: Form }) {
  const { t } = useLocale();
  const { fields, append, remove } = useFieldArray({ control, name: "links" });
  const { errors } = useFormState({ control, name: "links" });
  const listError = errors.links?.root ?? errors.links;
  const platformName = (platform: LinkPlatform) =>
    platform === "website"
      ? t("Website")
      : platform === "phone"
        ? t("Phone number")
        : SOCIAL_PLATFORMS[platform].name;
  return (
    <>
      <FieldDescription>
        {t("WhatsApp is required: customers order there.")}
      </FieldDescription>
      {fields.map((item, index) => (
        <Controller
          key={item.id}
          control={control}
          name={`links.${index}.url`}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Controller
                control={control}
                name={`links.${index}.platform`}
                render={({ field: platform }) => (
                  <ButtonGroup dir="ltr" className={JOINED}>
                    <PlatformButton
                      value={platform.value}
                      onChange={platform.onChange}
                      label={`${t("Link {{n}}: type", { n: index + 1 })} — ${platformName(platform.value)}`}
                      platformName={platformName}
                    />
                    <Input
                      {...field}
                      {...(isNumberPlatform(platform.value)
                        ? NUMBER_INPUT
                        : LINK_INPUT)}
                      aria-label={t("Link {{n}}: address", { n: index + 1 })}
                      data-invalid={fieldState.invalid}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      enterKeyHint="next"
                      className={INPUT}
                    />
                    <RemoveButton
                      label={t("Remove link {{n}}", { n: index + 1 })}
                      onClick={() => remove(index)}
                    />
                  </ButtonGroup>
                )}
              />
              <FormError error={fieldState.error} />
            </Field>
          )}
        />
      ))}
      {typeof listError?.message === "string" && (
        <FieldError>{t(listError.message as MessageKey)}</FieldError>
      )}
      {fields.length < 15 && (
        <AddButton
          label={t("Add a link")}
          onClick={() =>
            append({
              // The first one is WhatsApp until there is one.
              platform: fields.some((f) => f.platform === "whatsapp")
                ? "phone"
                : "whatsapp",
              url: "",
            })
          }
        />
      )}
    </>
  );
}

/** The kind's icon in its brand colours; opens a sheet to change it. */
function PlatformButton({
  value,
  onChange,
  label,
  platformName,
}: {
  value: LinkPlatform;
  onChange: (value: LinkPlatform) => void;
  label: string;
  platformName: (platform: LinkPlatform) => string;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const { icon, colors } = SOCIAL_PLATFORMS[value];
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={label}
        onClick={() => setOpen(true)}
        className="size-11 shrink-0"
      >
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full",
            colors,
          )}
        >
          <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
        </span>
      </Button>
      <ActionSheet
        open={open}
        onOpenChange={setOpen}
        title={t("Link type")}
        actions={LINK_PLATFORMS.map((platform) => ({
          label: platformName(platform),
          icon: SOCIAL_PLATFORMS[platform].icon,
          iconColors: SOCIAL_PLATFORMS[platform].colors,
          onSelect: () => onChange(platform),
        }))}
      />
    </>
  );
}
