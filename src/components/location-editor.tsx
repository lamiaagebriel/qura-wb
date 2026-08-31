"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Call02Icon,
  Delete02Icon,
  MapsLocation01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker, type LatLng } from "@/components/location-picker";
import type { LocationFormValues } from "@/lib/location";
import { detectSocialPlatform } from "@/lib/social";
import { useLocale } from "@/lib/i18n/client";

/** One location shape, not a type picker — `description` is the only
 * required part (an address, a named area, "delivery only, no storefront",
 * whatever actually tells someone where you are); the lat/lng pair below
 * it is an optional exact pin on top of that, dropped on a real map
 * (`LocationPicker`) rather than typed in by hand — nobody actually
 * knows their business's coordinates off the top of their head. */
export function LocationEditor({
  value,
  onChange,
}: {
  value: LocationFormValues;
  onChange: (next: LocationFormValues) => void;
}) {
  const { t } = useLocale();
  const [mapOpen, setMapOpen] = useState(false);
  const hasPin = value.lat !== "" && value.lng !== "";

  function handlePinSaved(coords: LatLng, description?: string) {
    onChange({
      ...value,
      lat: String(coords.lat),
      lng: String(coords.lng),
      // Auto-filled from the picked point's reverse-geocoded city/state
      // — but only into an empty field, never overwriting a description
      // already written by hand (re-picking the pin to nudge it a few
      // meters shouldn't blow away "2nd floor, blue door").
      description:
        value.description.trim() === "" && description
          ? description
          : value.description,
    });
    setMapOpen(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <Field>
        <FieldLabel>{t("Location")}</FieldLabel>
        <Textarea
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          maxLength={300}
          placeholder={t(
            "e.g. Downtown Aswan, near the Nubian Museum — 2nd floor, blue door",
          )}
        />
      </Field>

      <Field>
        <FieldLabel>{t("Exact coordinates (optional)")}</FieldLabel>
        {hasPin ? (
          <div className="flex items-center gap-2">
            <span
              dir="ltr"
              className="text-muted-foreground flex-1 text-[12.5px]"
            >
              {Number(value.lat).toFixed(6)}, {Number(value.lng).toFixed(6)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMapOpen(true)}
            >
              {t("Change pin")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onChange({ ...value, lat: "", lng: "" })}
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
            </Button>
          </div>
        ) : (
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit gap-1.5"
              onClick={() => setMapOpen(true)}
            >
              <HugeiconsIcon icon={MapsLocation01Icon} className="size-3.5" />
              {t("Pick location on map")}
            </Button>
          </div>
        )}
      </Field>

      <Sheet open={mapOpen} onOpenChange={setMapOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{t("Pick location on map")}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <LocationPicker
              initialLocation={
                hasPin
                  ? { lat: Number(value.lat), lng: Number(value.lng) }
                  : null
              }
              onSave={handlePinSaved}
              onClose={() => setMapOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function PhonesEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useLocale();
  return (
    <Field>
      <FieldLabel>{t("Phone numbers")}</FieldLabel>
      <div className="flex flex-col gap-1.5">
        {value.map((phone, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <HugeiconsIcon
                icon={Call02Icon}
                className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2"
              />
              <Input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const next = [...value];
                  next[index] = e.target.value;
                  onChange(next);
                }}
                placeholder="+20 10 1234 5678"
                className="ps-8"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
            </Button>
          </div>
        ))}
        {value.length < 5 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={() => onChange([...value, ""])}
          >
            <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
            {t("Add phone number")}
          </Button>
        )}
      </div>
    </Field>
  );
}

/** One row per link, each showing the platform icon it's currently
 * detected as (`detectSocialPlatform`, keyed off the URL's hostname) —
 * paste your Instagram/Facebook/X/TikTok/whatever link and the icon
 * updates as you type, rather than making you pick a platform from a
 * separate dropdown that then has to stay in sync with the URL. */
export function SocialLinksEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useLocale();
  return (
    <Field>
      <FieldLabel>{t("Social links")}</FieldLabel>
      <FieldDescription>
        {t("Add your Instagram, Facebook, X, TikTok, or website link.")}
      </FieldDescription>
      <div className="flex flex-col gap-1.5">
        {value.map((link, index) => {
          const platform = detectSocialPlatform(link);
          return (
            <div key={index} className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <HugeiconsIcon
                  icon={platform.icon}
                  className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2"
                />
                <Input
                  type="url"
                  value={link}
                  onChange={(e) => {
                    const next = [...value];
                    next[index] = e.target.value;
                    onChange(next);
                  }}
                  placeholder="https://instagram.com/yourbusiness"
                  className="ps-8"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
              </Button>
            </div>
          );
        })}
        {value.length < 6 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={() => onChange([...value, ""])}
          >
            <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
            {t("Add social link")}
          </Button>
        )}
      </div>
    </Field>
  );
}
