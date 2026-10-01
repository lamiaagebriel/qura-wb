"use client";

// The phone's current position, with an error that says what to fix.
// Browsers only share location with secure pages (https or localhost) — a
// phone testing the dev server at http://192.168.x.x always gets refused.

import { useState } from "react";

import { toast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/types";

type Coords = { lat: number; lng: number };

class LocationError extends Error {
  constructor(readonly reason: MessageKey) {
    super(reason);
  }
}

const position = (options: PositionOptions) =>
  new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, options),
  );

/**
 * GPS first; if that's slow or unavailable (indoors, desktops), the
 * network-based position (Wi-Fi / cell), which is quick and close enough.
 */
async function currentPosition(): Promise<Coords> {
  if (!window.isSecureContext) {
    throw new LocationError("Location only works on a secure (https) connection.");
  }
  if (!("geolocation" in navigator)) {
    throw new LocationError("This browser can't share your location.");
  }
  try {
    let found: GeolocationPosition;
    try {
      found = await position({ enableHighAccuracy: true, timeout: 10_000 });
    } catch (error) {
      if ((error as GeolocationPositionError).code === 1) throw error;
      found = await position({
        enableHighAccuracy: false,
        timeout: 15_000,
        maximumAge: 60_000,
      });
    }
    return { lat: found.coords.latitude, lng: found.coords.longitude };
  } catch (error) {
    const code = (error as GeolocationPositionError).code;
    throw new LocationError(
      code === 1
        ? "Allow location access for this site in your settings, then try again."
        : code === 3
          ? "Finding your location took too long. Try again."
          : "Couldn't get your location",
    );
  }
}

/**
 * `locate(onFound)`: gets the position (a toast explains any failure);
 * `locating` while it looks.
 */
export function useCurrentLocation() {
  const { t } = useLocale();
  const [locating, setLocating] = useState(false);
  const locate = async (onFound: (coords: Coords) => void) => {
    setLocating(true);
    try {
      onFound(await currentPosition());
    } catch (error) {
      toast.add({
        title: t("Couldn't get your location"),
        description:
          error instanceof LocationError && error.reason !== "Couldn't get your location"
            ? t(error.reason)
            : undefined,
        type: "error",
      });
    } finally {
      setLocating(false);
    }
  };
  return { locate, locating };
}
