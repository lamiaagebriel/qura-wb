"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMapsLibrary,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";

import { Button } from "@/components/ui/button";

export type LatLng = { lat: number; lng: number };

// Falls back to a plain-city view (Tunis) when there's no existing pin
// to center on — arbitrary, just has to be *somewhere* reasonable so
// the map isn't staring at the middle of the ocean (0, 0) on first open.
const DEFAULT_CENTER: LatLng = { lat: 36.8065, lng: 10.1815 };
const DEFAULT_ZOOM = 12;
const PIN_ZOOM = 15;

// Google's official React wrapper (`@vis.gl/react-google-maps`) reads
// this from the environment at build time — `NEXT_PUBLIC_` is required
// for it to reach the browser bundle at all, same as any client-side
// env var in Next.js.
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// A Map ID is required for `AdvancedMarker` (the modern, draggable
// marker API) to render at all — it's a *styling* id from Google Cloud
// Console (Map Management), not a secret, so it's fine to default to a
// placeholder here. See the setup notes for how to create a real one.
const GOOGLE_MAPS_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

/** "City, State, Country" out of a geocoder result's structured address
 * components — reads much better as a location description than the
 * full street-level `formatted_address` does. Falls back to
 * `formatted_address` for a pin dropped somewhere with no locality
 * (open water, deep countryside), so there's always *something*. */
function describeGeocoderResult(result: google.maps.GeocoderResult): string {
  const components = result.address_components;
  const find = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name;

  const city = find("locality") ?? find("sublocality") ?? find("administrative_area_level_2");
  const state = find("administrative_area_level_1");
  const country = find("country");

  const parts = [city, state, country].filter((p): p is string => !!p);
  return parts.length > 0 ? parts.join(", ") : result.formatted_address;
}

/** No UI of its own — just watches `pin` and reverse-geocodes it
 * whenever it changes, reporting the result back up. Split out from
 * `LocationPicker` because `useMapsLibrary` (like every hook from
 * `@vis.gl/react-google-maps`) only works inside `<APIProvider>`, and
 * `LocationPicker` itself has to render its "map unavailable" fallback
 * *outside* that provider (no API key means no provider to put it in). */
function ReverseGeocoder({
  pin,
  onResolved,
}: {
  pin: LatLng | null;
  onResolved: (description: string) => void;
}) {
  const geocodingLibrary = useMapsLibrary("geocoding");
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (!geocodingLibrary || !pin) return;

    geocoderRef.current ??= new geocodingLibrary.Geocoder();
    geocoderRef.current.geocode({ location: pin }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        onResolved(describeGeocoderResult(results[0]));
      }
    });
    // `onResolved` is a fresh closure every render in the caller — only
    // `pin` (and the library finishing its own one-time load) should
    // ever actually re-trigger a lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geocodingLibrary, pin]);

  return null;
}

/**
 * Click the map (or drag the pin) to get coordinates, plus a
 * reverse-geocoded "City, State, Country" description of wherever you
 * dropped it — read entirely from Google's own Geocoding library
 * already loaded alongside the map, no separate backend route. Two
 * modes, driven by `initialLocation`:
 *
 * - `null` (ADD): empty map, default center, no pin until the first
 *   click.
 * - `{ lat, lng }` (EDIT): map centers on that point with a pin already
 *   placed there.
 *
 * Clicking anywhere moves the pin to that exact spot; the pin is also
 * directly draggable for fine-tuning afterward. Nothing is persisted
 * here — `onSave` just hands the final coordinates (and the resolved
 * description, if geocoding succeeded in time) back to the caller,
 * which decides what to do with them.
 */
export function LocationPicker({
  initialLocation,
  onSave,
  onClose,
}: {
  initialLocation: LatLng | null;
  onSave: (coords: LatLng, description?: string) => void;
  onClose?: () => void;
}) {
  // The pin's current position — starts wherever `initialLocation` says
  // (edit mode) or `null` (add mode, no pin drawn until the map is
  // clicked for the first time).
  const [pin, setPin] = useState<LatLng | null>(initialLocation);
  // The last successfully reverse-geocoded description for `pin` —
  // cleared on every pin move so a stale description never gets shown
  // (or saved) for a point it no longer describes.
  const [description, setDescription] = useState<string | null>(null);

  // A single click anywhere on the map drops (or moves) the pin to
  // exactly that point. `event.detail.latLng` is the clicked
  // geographic coordinate Google's SDK computed from the pixel you
  // clicked — already plain `{lat, lng}` numbers, no geocoding involved
  // in *this* step (that happens separately, in `ReverseGeocoder`).
  const handleMapClick = useCallback((event: MapMouseEvent) => {
    const latLng = event.detail.latLng;
    if (!latLng) return;
    setDescription(null);
    setPin({ lat: latLng.lat, lng: latLng.lng });
  }, []);

  // Fires continuously while the marker is being dragged, and once more
  // on release — `event.latLng` here comes from the underlying
  // `google.maps.marker.AdvancedMarkerElement`, same shape as the map
  // click event above.
  const handleMarkerDrag = useCallback(
    (event: google.maps.MapMouseEvent) => {
      const latLng = event.latLng;
      if (!latLng) return;
      setDescription(null);
      setPin({ lat: latLng.lat(), lng: latLng.lng() });
    },
    [],
  );

  const handleSave = useCallback(() => {
    if (pin) onSave(pin, description ?? undefined);
  }, [pin, description, onSave]);

  // Missing key or the SDK not having loaded yet (slow network, ad
  // blocker, etc.) both land here instead of throwing — a picker that
  // can't pick anything should say so, not white-screen the page.
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="border-border bg-muted/30 flex flex-col items-center gap-2 rounded-lg border p-6 text-center">
        <p className="text-foreground text-[13px] font-medium">
          Map unavailable
        </p>
        <p className="text-muted-foreground text-[12.5px]">
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY isn&apos;t set. Add it to your
          environment file and restart the dev server.
        </p>
        {onClose && (
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="flex flex-col gap-2">
        <div className="border-border h-72 w-full overflow-hidden rounded-lg border">
          <Map
            mapId={GOOGLE_MAPS_MAP_ID}
            defaultCenter={initialLocation ?? DEFAULT_CENTER}
            defaultZoom={initialLocation ? PIN_ZOOM : DEFAULT_ZOOM}
            onClick={handleMapClick}
            disableDefaultUI
            zoomControl
            gestureHandling="greedy"
          >
            {pin && (
              <AdvancedMarker
                position={pin}
                draggable
                onDrag={handleMarkerDrag}
              />
            )}
          </Map>
        </div>

        <ReverseGeocoder pin={pin} onResolved={setDescription} />

        {/* The resolved place name reads as "the current location" —
            raw coordinates only show underneath, as a small reference,
            not the headline. */}
        {pin ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground text-[13px] font-medium">
              {description ?? "Locating…"}
            </span>
            <span dir="ltr" className="text-muted-foreground text-[11px]">
              {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
            </span>
          </div>
        ) : (
          <div className="text-muted-foreground text-[12.5px]">
            Click the map to drop a pin.
          </div>
        )}

        <div className="flex gap-2">
          <Button type="button" disabled={!pin} onClick={handleSave}>
            {initialLocation ? "Update Location" : "Save Location"}
          </Button>
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </APIProvider>
  );
}
