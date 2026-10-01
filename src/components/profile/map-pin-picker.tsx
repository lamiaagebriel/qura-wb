"use client";

import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useState } from "react";

import { Gps01Icon, HugeiconsIcon, MapPinIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentLocation } from "@/lib/geolocation";
import { useLocale } from "@/lib/i18n/provider";

type Coords = { lat: number; lng: number };

// Where the map opens when there's no pin yet (Aswan).
const DEFAULT_CENTER: Coords = { lat: 24.0889, lng: 32.8998 };

/**
 * Pick a map pin on Google Maps: drag the map under the fixed pin (or tap
 * a spot), then "Use this location". `onRemove` (when a pin is set) clears
 * it. `apiKey`: GOOGLE_MAPS_API_KEY.
 */
export function MapPinPicker({
  apiKey,
  open,
  onOpenChange,
  initial,
  onPick,
  onRemove,
}: {
  apiKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Coords | null;
  onPick: (coords: Coords) => void;
  onRemove?: () => void;
}) {
  const { t } = useLocale();
  const [center, setCenter] = useState<Coords>(initial ?? DEFAULT_CENTER);

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (next) setCenter(initial ?? DEFAULT_CENTER);
        onOpenChange(next);
      }}
    >
      <DrawerContent className="h-[calc(var(--app-height)*0.88)] pb-[max(var(--safe-bottom),1rem)]">
        <DrawerHeader>
          <DrawerTitle className="text-base">{t("Pick on the map")}</DrawerTitle>
          <DrawerDescription>
            {t("Move the map until the pin is on your business.")}
          </DrawerDescription>
        </DrawerHeader>

        {open && (
          <APIProvider apiKey={apiKey}>
            {/* The map pans itself — the sheet mustn't drag from here. */}
            <div data-vaul-no-drag className="relative mx-4 flex-1 overflow-hidden rounded-2xl bg-muted">
              <Map
                defaultCenter={initial ?? DEFAULT_CENTER}
                defaultZoom={initial ? 17 : 13}
                gestureHandling="greedy"
                disableDefaultUI
                clickableIcons={false}
                onCameraChanged={(event) => setCenter(event.detail.center)}
                // Tapping a spot moves it under the pin.
                onClick={(event) => {
                  if (event.detail.latLng) event.map.panTo(event.detail.latLng);
                }}
                className="size-full"
              />
              <CenterPin />
              <LocateButton onFound={setCenter} />
            </div>
          </APIProvider>
        )}

        <DrawerFooter className="gap-3 px-4 pt-3 pb-0">
          <Button
            type="button"
            size="xl"
            className="w-full rounded-2xl text-base"
            onClick={() => {
              onPick(center);
              onOpenChange(false);
            }}
          >
            {t("Use this location")}
          </Button>
          {initial && onRemove && (
            <Button
              type="button"
              size="xl"
              variant="ghost"
              className="w-full rounded-2xl text-base text-destructive"
              onClick={() => {
                onRemove();
                onOpenChange(false);
              }}
            >
              {t("Remove the location")}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/** The pin, fixed at the centre: its tip marks the spot. */
function CenterPin() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <HugeiconsIcon
        icon={MapPinIcon}
        strokeWidth={2}
        className="size-10 -translate-y-1/2 fill-primary text-primary-foreground drop-shadow-md"
      />
    </div>
  );
}

/** Pans to where the phone is. */
function LocateButton({ onFound }: { onFound: (coords: Coords) => void }) {
  const { t } = useLocale();
  const map = useMap();
  const { locate, locating } = useCurrentLocation();
  const goHere = () =>
    locate((coords) => {
      // Chosen right away, even before the map has loaded.
      onFound(coords);
      map?.panTo(coords);
      map?.setZoom(17);
    });
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label={t("Use my current location")}
      onClick={goHere}
      disabled={locating}
      className="absolute end-3 bottom-3 size-11 rounded-full shadow-md"
    >
      {locating ? (
        <Spinner />
      ) : (
        <HugeiconsIcon icon={Gps01Icon} strokeWidth={2} className="size-5" />
      )}
    </Button>
  );
}
