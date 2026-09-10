"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Clock01Icon } from "@hugeicons/core-free-icons";
import { Location01Icon, MapsLocation01Icon, SparklesIcon } from "@hugeicons/core-free-icons";

import { AddToQuraSheet } from "@/components/add-to-qura-sheet";
import { buttonVariants } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/client";
import type { CityId } from "@/db/schema";
import { cn } from "@/lib/utils";

type GooglePlaceInput = {
  placeId: string;
  name: string;
  address?: string | null;
  location?: { latitude: number; longitude: number } | null;
  types: string[];
};

/**
 * One place card, shared between `search-view.tsx`'s result list and
 * `category-results.tsx`'s category browse list — a place found by name
 * in Search reads identically to the same place found by browsing a
 * category, right down to the pixel. Purely presentational: every
 * caller resolves its own icon/category/directions URL/click handlers
 * from whatever shape its own data source hands it (`UnifiedSearchResult`
 * vs `CategoryDiscoveryResult` share no common type), and passes the
 * result in as plain props.
 *
 * `source` drives the one visible difference between a Qura-backed and a
 * Google-only place: the tag under the name ("Qura Profile" vs "Google
 * Places"), the Directions button's fill (solid for a business Qura
 * already knows about, outline for a place it doesn't), and whether an
 * "Add to Qura" CTA appears at all.
 */
export function PlaceResultCard({
  icon,
  name,
  nameHref,
  onNameClick,
  source,
  metaLine,
  description,
  directionsUrl,
  viewHref,
  onViewClick,
  googlePlace,
  activeCity,
  children,
}: {
  icon: typeof Clock01Icon;
  name: string;
  // No `nameHref` means the name renders as plain text, not a link —
  // the "google" source with no Qura profile to navigate to.
  nameHref?: string;
  onNameClick?: () => void;
  source: "qura" | "google";
  metaLine?: string | null;
  description?: string | null;
  directionsUrl?: string | null;
  viewHref?: string;
  onViewClick?: () => void;
  // Only meaningful (and only ever shown, as the "Add to Qura" CTA) when
  // `source === "google"`.
  googlePlace?: GooglePlaceInput;
  activeCity?: CityId;
  // Extra content between the description and the action row — e.g. the
  // list of other Qura businesses sharing one Google place.
  children?: ReactNode;
}) {
  const { t } = useLocale();

  return (
    <div className="border-border rounded-2xl border p-3.5">
      <div className="mb-2.5 flex gap-3">
        <span className="bg-primary flex size-13 shrink-0 items-center justify-center rounded-full">
          <HugeiconsIcon
            icon={icon}
            className="text-primary-foreground size-5.5"
            strokeWidth={1.7}
          />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          {nameHref ? (
            <Link
              href={nameHref}
              onClick={onNameClick}
              className="text-foreground text-[15px] font-bold hover:underline"
            >
              {name}
            </Link>
          ) : (
            <span className="text-foreground text-[15px] font-bold">
              {name}
            </span>
          )}

          {source === "google" ? (
            <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[10.5px] font-bold">
              <HugeiconsIcon icon={Location01Icon} className="size-3" />
              {t("Google Places")}
            </div>
          ) : (
            <div className="text-primary mt-0.5 flex items-center gap-1 text-[10.5px] font-bold">
              <HugeiconsIcon icon={SparklesIcon} className="size-3" />
              {t("Qura Profile")}
            </div>
          )}
        </div>
      </div>

      {metaLine && (
        <p className="text-muted-foreground mb-1.5 text-[12px]">{metaLine}</p>
      )}

      {description && (
        <p className="text-foreground mb-2.5 text-[12.5px] leading-snug">
          {description}
        </p>
      )}

      {children}

      <div className="flex gap-2">
        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: source === "google" ? "outline" : "default" }),
              "h-9 flex-1 gap-1.5 rounded-lg text-[12.5px]",
            )}
          >
            <HugeiconsIcon icon={MapsLocation01Icon} className="size-3.5" />
            {t("Directions")}
          </a>
        )}
        {viewHref && (
          <Link
            href={viewHref}
            onClick={onViewClick}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-9 flex-1 rounded-lg text-[12.5px]",
            )}
          >
            {t("View")}
          </Link>
        )}
        {source === "google" && googlePlace && activeCity && (
          <div className="flex-1">
            <AddToQuraSheet googlePlace={googlePlace} activeCity={activeCity} />
          </div>
        )}
      </div>
    </div>
  );
}
