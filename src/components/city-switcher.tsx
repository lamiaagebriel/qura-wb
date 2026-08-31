"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  MapPinIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CityId } from "@/db/schema/cities";
import { useLocale } from "@/lib/i18n/client";
import { setActiveCity } from "@/lib/city/actions";
import { CITY_LABEL, CITY_ORDER, isCityAvailable } from "@/lib/city/cities";

/**
 * The `📍 Aswan` row in `HomeHeader` — tapping it opens this, and picking
 * a different city switches the *whole app's* content to that city
 * (`setActiveCity` sets a cookie and revalidates, same pattern as
 * `ProfileSwitcher`/language switching). Only `aswan`/`luxor` have real
 * content right now (`isCityAvailable`) — every other city in the list
 * is still selectable (so switching to it is what actually shows the
 * "coming soon" state everywhere, rather than being unreachable), just
 * marked with a badge instead of a checkmark opportunity.
 */
export function CitySwitcher({ activeCity }: { activeCity: CityId }) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function select(city: CityId) {
    setOpen(false);
    if (city === activeCity) return;
    startTransition(async () => {
      await setActiveCity(city);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-muted-foreground flex items-center gap-1 text-[13px] font-medium"
      >
        <HugeiconsIcon icon={MapPinIcon} className="size-3.5" />
        <span>{t(CITY_LABEL[activeCity])}</span>
        <HugeiconsIcon icon={ArrowDown01Icon} className="size-3" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{t("Switch city")}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col px-4 pb-6">
            {CITY_ORDER.map((city) => (
              <button
                key={city}
                type="button"
                disabled={isPending || !isCityAvailable(city)}
                onClick={() => select(city)}
                className="border-border/60 flex items-center gap-3 border-b py-3 disabled:opacity-50"
              >
                <div className="flex flex-1 flex-col text-start leading-tight">
                  <span className="text-foreground text-[13.5px] font-medium">
                    {t(CITY_LABEL[city])}
                  </span>
                  {!isCityAvailable(city) && (
                    <span className="text-muted-foreground text-xs">
                      {t("Coming soon")}
                    </span>
                  )}
                </div>
                {city === activeCity && (
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    className="text-primary size-4 shrink-0"
                  />
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
