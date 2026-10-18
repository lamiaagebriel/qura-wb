"use client";

import { useState } from "react";

import { ArrowDown01Icon, HugeiconsIcon, PinIcon } from "@/components/icons";
import { PlacePicker } from "@/components/places/place-picker";
import { usePlaces } from "@/components/places/places-provider";
import { useLocale } from "@/lib/i18n/provider";
import { placeLabel } from "@/lib/places";

/**
 * A form's place: shows the picked one ("Edfu, Aswan") and opens the place
 * picker to change it. `label` names the field ("City", "Where").
 */
export function PlaceField({
  value,
  onChange,
  label,
  id,
  emptyLabel,
}: {
  value: string;
  onChange: (slug: string) => void;
  label: string;
  id?: string;
  /** Shown when nothing is picked (the dashboard's "Top level"). */
  emptyLabel?: string;
}) {
  const { t, locale } = useLocale();
  const places = usePlaces();
  const [open, setOpen] = useState(false);
  const current = value ? placeLabel(places, value, locale) : (emptyLabel ?? "");

  return (
    <>
      <button
        id={id}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={t("{{label}}: {{place}}", { label, place: current })}
        className="flex h-11 items-center justify-between gap-2 rounded-xl bg-card px-4 text-start text-sm font-medium ring-1 ring-foreground/10"
      >
        <span className="flex min-w-0 items-center gap-2">
          <HugeiconsIcon
            icon={PinIcon}
            strokeWidth={2}
            className="size-4 shrink-0 text-primary"
          />
          <span className="truncate">{current}</span>
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className="size-4 shrink-0 text-muted-foreground"
        />
      </button>
      <PlacePicker
        open={open}
        onOpenChange={setOpen}
        value={value}
        onSelect={(slug) => {
          setOpen(false);
          onChange(slug);
        }}
        title={label}
      />
    </>
  );
}
