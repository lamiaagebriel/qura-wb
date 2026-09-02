"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Location01Icon,
  Loading03FreeIcons,
  Search01Icon,
} from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  claimGooglePlaceAction,
  disconnectGooglePlaceAction,
} from "@/lib/business/actions/claim-google-place";
import { searchGooglePlacesForConnectionAction } from "@/lib/business/actions/search-google-places";
import { handleAppError } from "@/lib/errors-client";
import type { GooglePlaceCacheResult } from "@/lib/business/google-place-cache";
import type { GooglePlaceSearchResult } from "@/lib/google-places/types";
import { useLocale } from "@/lib/i18n/client";

// Google Maps' public "look up by place id" deep link — no API key
// needed, works for any place id regardless of how Qura learned about it.
function googleMapsPlaceUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
}

type Step = "search" | "confirm" | "success";

export type ConnectedGooglePlace = {
  googlePlaceId: string;
  place: GooglePlaceCacheResult | null;
};

/**
 * The business owner's Google Place connections section — Phase 24: a
 * business may hold several at once (physical branches, each with its own
 * Google listing), so this renders one card per existing connection plus
 * an always-available "Add a Google Place" trigger, rather than a single
 * connect-or-view slot. Deliberately terminology-careful throughout:
 * "connect"/"branch", never "claim ownership" — connecting only ever
 * records "this Qura business is associated with this Google Place,"
 * never that Qura verified who legally owns the Google listing, and
 * never implies exclusivity — other Qura businesses may already be
 * connected to the same place, which is expected, not an error.
 */
export function GooglePlaceConnection({
  businessId,
  connectedPlaces,
}: {
  businessId: string;
  connectedPlaces: ConnectedGooglePlace[];
}) {
  const router = useRouter();
  const onChanged = () => router.refresh();

  return (
    <div className="flex flex-col gap-3">
      {connectedPlaces.map((connected) => (
        <ConnectedCard
          key={connected.googlePlaceId}
          businessId={businessId}
          googlePlaceId={connected.googlePlaceId}
          place={connected.place}
          onDisconnected={onChanged}
        />
      ))}
      <ConnectFlow businessId={businessId} onConnected={onChanged} />
    </div>
  );
}

function ConnectedCard({
  businessId,
  googlePlaceId,
  place,
  onDisconnected,
}: {
  businessId: string;
  googlePlaceId: string;
  place: GooglePlaceCacheResult | null;
  onDisconnected: () => void;
}) {
  const { t } = useLocale();
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [isPending, startTransition] = useTransition();

  // `place` is `null` here only in the instant before this page has
  // fetched anything unusual (it shouldn't normally happen once
  // connected) — treated the same as `"unavailable"`: show the raw id,
  // no name/address, connection state untouched either way.
  const details = place?.status === "fresh" || place?.status === "stale" ? place.details : null;
  const isStale = place?.status === "stale";

  const handleDisconnect = () => {
    startTransition(async () => {
      const result = await disconnectGooglePlaceAction(businessId, googlePlaceId);
      if (!result.success) {
        handleAppError(result.error);
        return;
      }
      setConfirmingDisconnect(false);
      onDisconnected();
    });
  };

  return (
    <div className="border-border flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={Location01Icon} className="text-muted-foreground size-4" />
        <span className="text-foreground text-[13px] font-medium">
          {t("Connected to Google")}
        </span>
      </div>

      <div className="flex flex-col leading-tight">
        <span className="text-foreground text-[13.5px] font-medium">
          {details?.name ?? googlePlaceId}
        </span>
        {details?.address && (
          <span className="text-muted-foreground text-xs">{details.address}</span>
        )}
        {isStale && (
          <span className="text-muted-foreground text-[11px]">
            {t("This Google information may be out of date.")}
          </span>
        )}
        {place?.status === "unavailable" && (
          <span className="text-muted-foreground text-[11px]">
            {t("Google information isn't available right now.")}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <a href={googleMapsPlaceUrl(googlePlaceId)} target="_blank" rel="noreferrer">
            {t("View Google Place")}
          </a>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setConfirmingDisconnect(true)}
        >
          {t("Disconnect")}
        </Button>
      </div>

      <Sheet open={confirmingDisconnect} onOpenChange={setConfirmingDisconnect}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{t("Disconnect Google Place?")}</SheetTitle>
            <SheetDescription>
              {t(
                "Your Qura profile, reviews, posts, followers, and other data will not be deleted — only this branch's connection to this Google Place is removed.",
              )}
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={handleDisconnect}
            >
              {t("Disconnect")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmingDisconnect(false)}
            >
              {t("Cancel")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ConnectFlow({
  businessId,
  onConnected,
}: {
  businessId: string;
  onConnected: () => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GooglePlaceSearchResult[]>([]);
  const [selected, setSelected] = useState<GooglePlaceSearchResult | null>(null);
  const [conflict, setConflict] = useState(false);
  const [isSearching, startSearching] = useTransition();
  const [isConnecting, startConnecting] = useTransition();

  const reset = () => {
    setStep("search");
    setQuery("");
    setResults([]);
    setSelected(null);
    setConflict(false);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
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
    setSelected(place);
    setStep("confirm");
  };

  const handleConnect = () => {
    if (!selected) return;
    startConnecting(async () => {
      const result = await claimGooglePlaceAction(businessId, selected.placeId);
      if (!result.success) {
        handleAppError(result.error);
        return;
      }
      setConflict(result.data.conflict);
      setStep("success");
      onConnected();
    });
  };

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        {t("Add a Google Place")}
      </Button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[85vh]">
          {step === "search" && (
            <>
              <SheetHeader>
                <SheetTitle>{t("Connect your Google Place")}</SheetTitle>
                <SheetDescription>
                  {t(
                    "Search for your business on Google to link it to this Qura profile.",
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
                    <HugeiconsIcon
                      icon={Loading03FreeIcons}
                      strokeWidth={2.5}
                      className="size-4"
                    />
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
                            <span className="text-muted-foreground text-xs">
                              {place.address}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {step === "confirm" && selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                {selected.address && (
                  <SheetDescription>{selected.address}</SheetDescription>
                )}
              </SheetHeader>
              <div className="px-6 pb-2">
                <p className="text-muted-foreground text-[13px]">
                  {t("Is this your business? This links your Qura profile to this Google Place — it doesn't verify or transfer ownership of the Google listing.")}
                </p>
              </div>
              <SheetFooter>
                <Button type="button" disabled={isConnecting} onClick={handleConnect}>
                  {t("Connect")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("search")}
                >
                  {t("Back")}
                </Button>
              </SheetFooter>
            </>
          )}

          {step === "success" && selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    className="size-5 text-emerald-600"
                  />
                  <SheetTitle>{t("Google Place connected")}</SheetTitle>
                </div>
                <SheetDescription>
                  {conflict
                    ? t(
                        "This Google Place is also connected to another Qura business profile. Our team has been notified for review.",
                      )
                    : t(
                        "This connection lets Qura show Google information alongside your profile.",
                      )}
                </SheetDescription>
              </SheetHeader>
              <SheetFooter>
                <Button type="button" onClick={() => handleOpenChange(false)}>
                  {t("Done")}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
