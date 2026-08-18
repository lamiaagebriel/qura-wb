import * as z from "zod";

import type { Dict } from "@/lib/i18n/config";

type Translate = (key: keyof Dict) => string;

/**
 * Every business's location — one shape, not a type-picker between two.
 * `description` is the only required part (an address, a named area,
 * "delivery only", whatever actually tells a visitor where you are);
 * `lat`/`lng` are an optional precise Google Maps pin on top of that,
 * for whenever there's an exact point to drop. Shared across every
 * category — unlike the category-specific fields in
 * `validations/business-block.ts`, where you are matters regardless of
 * what you sell.
 */
export function createLocationSchema(t: Translate) {
  return z
    .object({
      description: z
        .string()
        .min(1, t("Please enter a location description."))
        .max(300, t("Must be at most 300 characters.")),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
    })
    .refine((v) => (v.lat === undefined) === (v.lng === undefined), {
      message: t("Enter both latitude and longitude, or neither."),
      path: ["lng"],
    });
}
export type Location = z.infer<ReturnType<typeof createLocationSchema>>;

const PHONE_RE = /^[+\d][\d\s-]{4,29}$/;

export function createPhonesSchema(t: Translate) {
  return z
    .array(z.string().regex(PHONE_RE, t("Enter a valid phone number.")))
    .max(5, t("Up to 5 phone numbers."));
}

export function googleMapsUrl(location: Location): string | null {
  if (location.lat === undefined || location.lng === undefined) return null;
  return `https://www.google.com/maps?q=${location.lat},${location.lng}`;
}

/** An embeddable Maps iframe src for an exact pin — no API key needed
 * (the plain `?q=...&output=embed` form is public), which is also
 * exactly why a description-only location can't get one: there's no
 * single point to center it on, only a name. */
export function googleMapsEmbedUrl(location: Location): string | null {
  if (location.lat === undefined || location.lng === undefined) return null;
  return `https://www.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`;
}

// The form's own loose shape (no zod resolver on the block form — see
// `business-profile-form.tsx`) — lat/lng stay strings here (form inputs
// are always strings) and get parsed to numbers only at submit time.
// Lives here, not in `components/location-editor.tsx`, because that
// file is `"use client"` and this needs calling from the server page
// that prefills the edit form.
export type LocationFormValues = {
  description: string;
  lat: string;
  lng: string;
};

export const EMPTY_LOCATION: LocationFormValues = {
  description: "",
  lat: "",
  lng: "",
};

/** The stored `Location` (or `undefined`, for a business that's never
 * set one) → this form's loose shape, for prefilling the edit form. */
export function toLocationFormValues(
  location: Location | null | undefined,
): LocationFormValues {
  if (!location) return EMPTY_LOCATION;
  return {
    description: location.description,
    lat: location.lat !== undefined ? String(location.lat) : "",
    lng: location.lng !== undefined ? String(location.lng) : "",
  };
}
