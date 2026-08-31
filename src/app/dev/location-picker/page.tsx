"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { LocationPicker, type LatLng } from "@/components/location-picker";

/**
 * Standalone demo of `LocationPicker` — simulates a business's saved
 * location entirely in local state (no backend call actually happens;
 * see the commented-out `fetch` below for what a real save looks like).
 * Not linked from anywhere in the app's nav — visit `/dev/location-picker`
 * directly.
 */
export default function LocationPickerDemoPage() {
  // Standing in for "this business's location, as currently saved in
  // the database" — `null` until the first save, same as a business
  // that's never set one. `description` is whatever the picker
  // reverse-geocoded the pin to at save time (or `undefined`, if the
  // Geocoding API hadn't resolved it in time) — same shape you'd store
  // alongside the coordinates in a real save.
  const [savedLocation, setSavedLocation] = useState<LatLng | null>(null);
  const [savedDescription, setSavedDescription] = useState<string | undefined>();
  const [pickerOpen, setPickerOpen] = useState(false);

  const openPicker = useCallback(() => setPickerOpen(true), []);
  const closePicker = useCallback(() => setPickerOpen(false), []);

  const handleSave = useCallback(async (coords: LatLng, description?: string) => {
    // --- Persisting to a real Next.js API route ---
    // Uncomment and point this at your own route once you have one; the
    // component itself doesn't care how (or whether) you persist the
    // coordinates, it only ever hands back plain numbers plus whatever
    // place name it managed to resolve for them.
    //
    // await fetch("/api/businesses/location", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     businessId: "the-current-business-id",
    //     lat: coords.lat,
    //     lng: coords.lng,
    //     description,
    //   }),
    // });

    setSavedLocation(coords);
    setSavedDescription(description);
    setPickerOpen(false);
  }, []);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="text-foreground text-lg font-semibold">
        Location Picker Demo
      </h1>

      {!pickerOpen && !savedLocation && (
        <Button type="button" onClick={openPicker}>
          + Add Location
        </Button>
      )}

      {!pickerOpen && savedLocation && (
        <div className="flex flex-col gap-2">
          {savedDescription && (
            <p className="text-foreground text-[13px] font-medium">
              {savedDescription}
            </p>
          )}
          <p className="text-muted-foreground text-[12.5px]">
            Current pin: {savedLocation.lat.toFixed(6)},{" "}
            {savedLocation.lng.toFixed(6)}
          </p>
          <Button type="button" variant="outline" onClick={openPicker}>
            Update Location
          </Button>
        </div>
      )}

      {pickerOpen && (
        <LocationPicker
          initialLocation={savedLocation}
          onSave={handleSave}
          onClose={closePicker}
        />
      )}
    </div>
  );
}
