"use client";

import { useState, useTransition } from "react";

import { ArrowDown01Icon, HugeiconsIcon, PinIcon } from "@/components/icons";
import { PlacePicker } from "@/components/places/place-picker";
import { usePlaces } from "@/components/places/places-provider";
import { setCity } from "@/lib/city-actions";
import { useLocale } from "@/lib/i18n/provider";
import { placeName } from "@/lib/places";
import { cn } from "@/lib/utils";

/**
 * The home header's place pill. Tapping it opens the place picker ("all of
 * Aswan" vs only Edfu, any depth); choosing one saves it and the page
 * re-renders for that place.
 */
export function CitySwitcher({ city }: { city: string }) {
  const { t, locale } = useLocale();
  const places = usePlaces();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const current = places.get(city);
  const name = current ? placeName(current, locale) : city;

  const choose = (next: string) => {
    setOpen(false);
    if (next !== city) startTransition(() => setCity(next));
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isPending}
        aria-haspopup="dialog"
        aria-label={t("City: {{city}}", { city: name })}
        className={cn(
          "flex h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold",
          isPending && "opacity-60",
        )}
      >
        <HugeiconsIcon icon={PinIcon} strokeWidth={2} className="size-4 text-primary" />
        <span className="max-w-28 truncate">{name}</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className="size-4 text-muted-foreground"
        />
      </button>

      <PlacePicker
        open={open}
        onOpenChange={setOpen}
        value={city}
        onSelect={choose}
        title={t("Choose your city")}
      />
    </>
  );
}
