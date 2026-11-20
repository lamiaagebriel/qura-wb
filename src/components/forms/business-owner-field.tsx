"use client";


import { Radio } from "@base-ui/react/radio";
import { Controller, type Control } from "react-hook-form";

import { FormError } from "@/components/forms/form-error";
import {
  HugeiconsIcon,
  Tick02Icon,
  UserAdd01Icon,
  UserCheck01Icon,
} from "@/components/icons";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { RadioGroup } from "@/components/ui/radio-group";
import { useLocale } from "@/lib/i18n/provider";
import { type BusinessFormValues } from "@/lib/validations/business-form";


type Form = Control<BusinessFormValues>;

/** Whoever adds a business says whether it's theirs (sets `ownerId`). */
export function OwnerField({ control }: { control: Form }) {
  const { t } = useLocale();
  const options = [
    {
      value: "me",
      icon: UserCheck01Icon,
      title: t("It's my business"),
      description: t("You own it and manage it."),
    },
    {
      value: "someone-else",
      icon: UserAdd01Icon,
      title: t("I'm adding it for someone else"),
      description: t("You can manage it until its owner claims it."),
    },
  ];
  return (
    <Controller
      control={control}
      name="owner"
      render={({ field, fieldState }) => (
        <FieldSet data-invalid={fieldState.invalid}>
          <FieldLegend>{t("Is this your business?")}</FieldLegend>
          <RadioGroup
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
            className="grid grid-cols-2 gap-2"
          >
            {options.map((option) => (
              // Card: light border; chosen → dark border + filled check.
              <label
                key={option.value}
                className="relative flex flex-col gap-2 rounded-2xl border border-border p-3 transition-colors has-data-checked:border-foreground has-data-checked:ring-1 has-data-checked:ring-foreground"
              >
                <Radio.Root
                  value={option.value}
                  className="group/radio absolute end-3 top-3 flex size-6 items-center justify-center rounded-full border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring/30 data-checked:border-foreground data-checked:bg-foreground"
                >
                  <Radio.Indicator className="flex text-background">
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      className="size-3.5"
                    />
                  </Radio.Indicator>
                </Radio.Root>
                <span className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
                  <HugeiconsIcon
                    icon={option.icon}
                    className="size-5"
                  />
                </span>
                <span className="text-sm font-semibold leading-snug">
                  {option.title}
                </span>
                <span className="text-xs leading-normal text-muted-foreground">
                  {option.description}
                </span>
              </label>
            ))}
          </RadioGroup>
          <FormError error={fieldState.error} />
        </FieldSet>
      )}
    />
  );
}
