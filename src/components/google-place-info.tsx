"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { GlobalIcon, StarIcon } from "@hugeicons/core-free-icons";

import { CallButton, FactRow, LocationSection } from "@/components/business-block-card";
import type { GooglePlaceCacheResult } from "@/lib/business/google-place-cache";
import { useLocale } from "@/lib/i18n/client";
import type { Dict } from "@/lib/i18n/config";

const NOT_OPERATIONAL_LABEL: Partial<Record<string, keyof Dict>> = {
  CLOSED_TEMPORARILY: "Temporarily closed",
  CLOSED_PERMANENTLY: "Permanently closed",
};

// Google Maps' public "look up by place id" deep link — no API key
// needed, works for any place id regardless of how Qura learned about it.
function googleMapsPlaceUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
}

/**
 * A connected Google Place's info, rendered as more rows of the SAME
 * block a business's own category info (`business-block-card.tsx`)
 * already renders — same row markup, same dividers, no separate
 * "Google" header/badge/box of its own. The business's own data still
 * comes first (rendered above this by the caller, `profile-tabs.tsx`,
 * one block per connected branch in connection order) — this only ever
 * *continues* that same visual block, never introduces a second one, so
 * the page reads as one profile with more facts, not "Qura info, then
 * some imported Google box."
 *
 * That's a presentation choice only — nothing here writes Google data
 * into Qura's own fields (see `google-place-cache.ts`'s doc comment:
 * `business_blocks`/`business_google_places` are never touched by a
 * Google read), and the required Places API attribution still exists —
 * `profile-tabs.tsx` renders it once, after every branch, rather than
 * repeating a "Powered by Google" badge per branch/row.
 *
 * "Connected but Google failed" never means "not connected" — the Qura
 * connection is never touched by anything in here or by anything this
 * renders; only an explicit Disconnect ever does that. `unavailable`
 * contributes nothing to render (there's nothing to blend in yet), which
 * is exactly right: it must never look like a broken/missing section,
 * just like this branch simply has nothing extra to show right now.
 */
export function GooglePlaceInfo({
  placeId,
  result,
}: {
  placeId: string;
  result: GooglePlaceCacheResult;
}) {
  const { t } = useLocale();

  if (result.status === "unavailable") return null;

  const details = result.details;
  const statusKey = details.businessStatus
    ? NOT_OPERATIONAL_LABEL[details.businessStatus]
    : undefined;
  const hasRating = details.rating !== undefined;
  const weekdayDescriptions = details.openingHours?.weekdayDescriptions;
  const location = details.address
    ? {
        description: details.address,
        ...(details.location
          ? { lat: details.location.latitude, lng: details.location.longitude }
          : {}),
      }
    : null;

  return (
    <>
      {statusKey && (
        <div className="container py-2">
          <span className="text-destructive text-[11px] font-medium">{t(statusKey)}</span>
        </div>
      )}

      {hasRating && (
        <FactRow
          fact={{
            label: t("Rating"),
            value: (
              <span className="inline-flex items-center gap-1" dir="ltr">
                <HugeiconsIcon
                  icon={StarIcon}
                  className="size-3.5 shrink-0 fill-current text-amber-500"
                />
                {details.rating!.toFixed(1)}
                {details.userRatingCount !== undefined && (
                  <span className="text-muted-foreground font-normal">
                    ({details.userRatingCount} {t("Google reviews")})
                  </span>
                )}
              </span>
            ),
          }}
        />
      )}

      {(details.phoneNumber || details.websiteUri) && (
        <div className="container flex items-center gap-2 py-2.5">
          {details.phoneNumber && <CallButton phones={[details.phoneNumber]} />}
          {details.websiteUri && (
            <a
              href={details.websiteUri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-[12.5px] font-medium"
            >
              <HugeiconsIcon icon={GlobalIcon} className="size-3.5" />
              {t("Website")}
            </a>
          )}
        </div>
      )}

      {weekdayDescriptions && weekdayDescriptions.length > 0 && (
        <WorkingHoursAccordionFromDescriptions lines={weekdayDescriptions} />
      )}

      {location && (
        <LocationSection
          location={location}
          mapsUrl={googleMapsPlaceUrl(placeId)}
          mapsEmbedUrl={null}
        />
      )}
    </>
  );
}

// Google's opening hours only ever come back as pre-localized display
// strings (`weekdayDescriptions`), never the structured per-day ranges
// `WorkingHoursAccordion` expects (that shape is Qura's own
// `WorkingHours` type, filled in by a business itself) — this renders
// Google's lines directly instead of forcing them through that
// component, but keeps the identical accordion row styling so it still
// reads as one more row in the same block, not a different widget.
function WorkingHoursAccordionFromDescriptions({ lines }: { lines: string[] }) {
  const { t } = useLocale();
  return (
    <details className="group">
      <summary className="container flex list-none items-center justify-between gap-4 py-2 text-[12.5px] [&::-webkit-details-marker]:hidden">
        <span className="text-muted-foreground">{t("Working hours")}</span>
        <span className="text-muted-foreground text-[11px] group-open:hidden">
          {t("Show hours")}
        </span>
      </summary>
      <div className="divide-border/50 flex flex-col divide-y">
        {lines.map((line, index) => (
          <div key={index} className="container py-2 text-[12.5px] text-foreground">
            {line}
          </div>
        ))}
      </div>
    </details>
  );
}
