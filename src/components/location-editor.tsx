"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Call02Icon, Delete02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Dict } from "@/lib/i18n/config";
import type { LocationFormValues } from "@/lib/location";
import { detectSocialPlatform } from "@/lib/social";

type Translate = (key: keyof Dict) => string;

/** One location shape, not a type picker — `description` is the only
 * required part (an address, a named area, "delivery only, no storefront",
 * whatever actually tells someone where you are); the lat/lng pair below
 * it is an optional exact pin on top of that, for whenever there's a
 * real point to drop. */
export function LocationEditor({
  value,
  onChange,
  t,
}: {
  value: LocationFormValues;
  onChange: (next: LocationFormValues) => void;
  t: Translate;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Field>
        <FieldLabel>{t("Location")}</FieldLabel>
        <Textarea
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          maxLength={300}
          placeholder={t("e.g. Downtown Sousse, near the medina — 2nd floor, blue door")}
        />
      </Field>

      <Field>
        <FieldLabel>{t("Exact coordinates (optional)")}</FieldLabel>
        <div className="flex gap-2">
          <Input
            type="number"
            step="any"
            value={value.lat}
            onChange={(e) => onChange({ ...value, lat: e.target.value })}
            placeholder={t("Latitude")}
          />
          <Input
            type="number"
            step="any"
            value={value.lng}
            onChange={(e) => onChange({ ...value, lng: e.target.value })}
            placeholder={t("Longitude")}
          />
        </div>
      </Field>
    </div>
  );
}

export function PhonesEditor({
  value,
  onChange,
  t,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  t: Translate;
}) {
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
                placeholder="+216 20 123 456"
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
  t,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  t: Translate;
}) {
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
