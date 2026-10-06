"use client";

import { useState, useTransition } from "react";

import { ArrowDown01Icon, HugeiconsIcon, PinIcon } from "@/components/icons";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { setCity } from "@/lib/city-actions";
import { CITY_TREE, cityOf, isCity, type CitySlug } from "@/lib/cities";
import { useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * The home header's city pill. Tapping it opens a bottom sheet to pick the
 * city — each with its sub-cities under it ("all of Aswan" vs only Edfu);
 * choosing one saves it and the page re-renders for that city.
 */
export function CitySwitcher({ city }: { city: CitySlug }) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const choose = (next: CitySlug) => {
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
        aria-label={t("City: {{city}}", { city: cityOf(city)!.name[locale] })}
        className={cn(
          "flex h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold",
          isPending && "opacity-60",
        )}
      >
        <HugeiconsIcon icon={PinIcon} strokeWidth={2} className="size-4 text-primary" />
        <span className="max-w-28 truncate">{cityOf(city)!.name[locale]}</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className="size-4 text-muted-foreground"
        />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("Choose your city")}</DrawerTitle>
          </DrawerHeader>
          <RadioGroup
            value={city}
            onValueChange={(value) => isCity(value) && choose(value)}
            aria-label={t("City")}
            className="mx-4 mb-[calc(var(--safe-bottom)+1rem)] w-auto gap-0 divide-y divide-border/60 overflow-hidden"
          >
            {CITY_TREE.flatMap(({ children, ...city }) => [
              { ...city, hasSubs: children.length > 0 },
              ...children.map((child) => ({ ...child, hasSubs: false })),
            ]).map((c) => (
              // The whole row is the label, so tapping anywhere selects it.
              <Label
                key={c.slug}
                className={cn(
                  "flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 py-2 pe-4",
                  c.parent ? "ps-10" : "ps-4",
                )}
              >
                <span className="flex flex-col">
                  <span
                    className={cn(
                      "text-sm",
                      c.parent ? "font-normal" : "font-semibold",
                    )}
                  >
                    {c.name[locale]}
                  </span>
                  {c.hasSubs && (
                    <span className="text-xs text-muted-foreground">
                      {t("All of {{city}}", { city: c.name[locale] })}
                    </span>
                  )}
                </span>
                <RadioGroupItem value={c.slug} />
              </Label>
            ))}
          </RadioGroup>
        </DrawerContent>
      </Drawer>
    </>
  );
}
