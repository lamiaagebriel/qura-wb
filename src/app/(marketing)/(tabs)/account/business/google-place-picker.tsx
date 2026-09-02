"use client";

import { useState, useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03FreeIcons, Location01Icon, Search01Icon } from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { searchGooglePlacesForConnectionAction } from "@/lib/business/actions/search-google-places";
import { handleAppError } from "@/lib/errors-client";
import type { GooglePlaceSearchResult } from "@/lib/google-places/types";
import { useLocale } from "@/lib/i18n/client";

/**
 * The "start from a Google Place" entry point on the CREATE business
 * form — a plain search-and-pick Sheet, deliberately with no separate
 * confirm step of its own: picking a result closes the sheet and hands
 * it straight to the caller, which shows its own preview + prefills the
 * form fields inline (see `business-profile-form.tsx`) rather than this
 * component duplicating that UI. Reuses the exact same search action
 * `google-place-connection.tsx`'s connect flow already uses — one Google
 * search boundary, not a second competing one.
 */
export function GooglePlacePicker({
  onSelect,
  label,
}: {
  onSelect: (place: GooglePlaceSearchResult) => void;
  label: string;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GooglePlaceSearchResult[]>([]);
  const [isSearching, startSearching] = useTransition();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setResults([]);
    }
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    startSearching(async () => {
      const result = await searchGooglePlacesForConnectionAction(value);
      if (!result.success) {
        handleAppError(result.error);
        return;
      }
      setResults(result.data.results);
    });
  };

  const handleSelect = (place: GooglePlaceSearchResult) => {
    onSelect(place);
    handleOpenChange(false);
  };

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        {label}
      </Button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[85vh]">
          <SheetHeader>
            <SheetTitle>{t("Find your business on Google")}</SheetTitle>
            <SheetDescription>
              {t(
                "Pick your listing to fill in your name, address, and a suggested category — you can still edit everything before saving.",
              )}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-2 overflow-y-auto px-6 pb-6">
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
              />
              <Input
                autoFocus
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t("Search for your business...")}
                className="ps-8"
              />
            </div>

            {isSearching && (
              <div className="flex justify-center py-6">
                <HugeiconsIcon icon={Loading03FreeIcons} strokeWidth={2.5} className="size-4" />
              </div>
            )}

            {!isSearching && query.trim().length >= 2 && results.length === 0 && (
              <p className="text-muted-foreground py-6 text-center text-[13px]">
                {t("No places found.")}
              </p>
            )}

            <ul className="flex flex-col">
              {results.map((place) => (
                <li key={place.placeId}>
                  <button
                    type="button"
                    onClick={() => handleSelect(place)}
                    className="hover:bg-muted flex w-full items-center gap-3 rounded-md px-2 py-3 text-start"
                  >
                    <Avatar>
                      <AvatarFallback>
                        <HugeiconsIcon icon={Location01Icon} className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col leading-tight">
                      <span className="text-foreground text-[13.5px] font-medium">
                        {place.name}
                      </span>
                      {place.address && (
                        <span className="text-muted-foreground text-xs">{place.address}</span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

