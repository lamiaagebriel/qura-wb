"use client";


import { useState } from "react";
import { Controller, useFieldArray, type Control } from "react-hook-form";

import { FormError } from "@/components/forms/form-error";
import { LocalizedField } from "@/components/forms/localized-field";
import {
  Delete02Icon,
  Gps01Icon,
  PinIcon,
  HugeiconsIcon,
} from "@/components/icons";
import { MapEmbed } from "@/components/map-embed";
import { PlaceField } from "@/components/places/place-field";
import { MapPinPicker } from "@/components/profile/map-pin-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { DEFAULT_PLACE } from "@/lib/places";
import { cn } from "@/lib/utils";
import { useCurrentLocation } from "@/lib/geolocation";
import { useLocale } from "@/lib/i18n/provider";
import {
  formatPin,
  parsePin,
  type BusinessFormValues,
} from "@/lib/validations/business-form";

import { AddButton } from "@/components/forms/joined-row";

type Form = Control<BusinessFormValues>;

/** Branches (at least one): the address in each language + the map pin. */
export function LocationFields({
  control,
  mapsApiKey,
}: {
  control: Form;
  mapsApiKey: string | null;
}) {
  const { t } = useLocale();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "locations",
  });
  return (
    <FieldSet>
      <FieldLegend>{t("Branches")}</FieldLegend>
      {fields.map((item, index) => (
        <FieldSet
          key={item.id}
          className="gap-4 rounded-2xl border p-3"
          aria-label={t("Branch {{n}}", { n: index + 1 })}
        >
          <LocalizedField
            control={control}
            name={`locations.${index}.address`}
            label={t("Address")}
            inputLabels={{
              en: t("Address (English)"),
              ar: t("Address (Arabic)"),
            }}
            maxLength={200}
            action={
              fields.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={t("Remove branch {{n}}", { n: index + 1 })}
                  onClick={() => remove(index)}
                  className="size-11 shrink-0 rounded-xl bg-input/20 text-muted-foreground dark:bg-input/30"
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    className="size-5"
                  />
                </Button>
              )
            }
          />
          <CityField control={control} index={index} />
          <PinField control={control} index={index} mapsApiKey={mapsApiKey} />
        </FieldSet>
      ))}
      {fields.length < 20 && (
        <AddButton
          label={t("Add a branch")}
          onClick={() =>
            append(
              {
                address: { en: "", ar: "" },
                city: DEFAULT_PLACE,
                pin: "",
              },
              { shouldFocus: false },
            )
          }
        />
      )}
    </FieldSet>
  );
}

/** The branch's place, picked from the tree (any depth). */
function CityField({ control, index }: { control: Form; index: number }) {
  const { t } = useLocale();
  return (
    <Controller
      control={control}
      name={`locations.${index}.city`}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldTitle>{t("City")}</FieldTitle>
          <PlaceField
            value={field.value}
            label={t("City")}
            onChange={(slug) => {
              field.onChange(slug);
              field.onBlur();
            }}
          />
          <FormError error={fieldState.error} />
        </Field>
      )}
    />
  );
}

/**
 * Where the branch is, shown on a map (people don't think in latitude /
 * longitude). Tapping the map picks it on Google Maps (where it can also
 * be removed) — or, without a Maps key, uses the phone's current location.
 */
function PinField({
  control,
  index,
  mapsApiKey,
}: {
  control: Form;
  index: number;
  mapsApiKey: string | null;
}) {
  const { t, locale } = useLocale();
  const { locate, locating } = useCurrentLocation();
  const [picking, setPicking] = useState(false);
  return (
    <Controller
      control={control}
      name={`locations.${index}.pin`}
      render={({ field, fieldState }) => {
        const pin = parsePin(field.value);
        const set = (coords: { lat: number; lng: number }) => {
          field.onChange(formatPin(coords));
          field.onBlur();
        };
        const edit = () => (mapsApiKey ? setPicking(true) : locate(set));
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldTitle className=" sr-only">
              {t("Location on the map")}
            </FieldTitle>
            {pin ? (
              <button
                type="button"
                onClick={edit}
                aria-label={t("Edit the location")}
                className="block h-36 overflow-hidden rounded-xl border bg-muted"
              >
                <MapEmbed
                  location={pin}
                  label={t("Location on the map")}
                  locale={locale}
                />
              </button>
            ) : (
              <button
                type="button"
                ref={field.ref}
                onClick={edit}
                disabled={locating}
                data-invalid={fieldState.invalid}
                className={cn(buttonVariants({ variant: "outline" }), "h-36 w-full flex-col gap-2 rounded-xl border-dashed bg-input/20 whitespace-normal text-muted-foreground data-[invalid=true]:border-destructive dark:bg-input/30")}
              >
                {locating ? (
                  <Spinner className="size-6" />
                ) : (
                  <HugeiconsIcon
                    icon={mapsApiKey ? PinIcon : Gps01Icon}
                    className="size-6"
                  />
                )}
                {mapsApiKey
                  ? t("Set the location on the map")
                  : t("Use my current location")}
              </button>
            )}
            <FormError error={fieldState.error} />
            {mapsApiKey && (
              <MapPinPicker
                apiKey={mapsApiKey}
                open={picking}
                onOpenChange={setPicking}
                initial={pin}
                onPick={set}
                onRemove={() => field.onChange("")}
              />
            )}
          </Field>
        );
      }}
    />
  );
}
