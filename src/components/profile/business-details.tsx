"use client";

import type { ReactNode } from "react";

import {
  ArrowRight01Icon,
  HugeiconsIcon,
  Location01Icon,
  StarIcon,
} from "@/components/icons";
import { StackLink } from "@/components/navigation/stack-link";
import { Accordion } from "@/components/ui/accordion";
import { useLocale } from "@/lib/i18n/provider";
import type { SocialLink } from "@/lib/socials";
import { cn } from "@/lib/utils";

import { HoursItem, type HoursDay } from "./business-hours";
import { LinksItem } from "./business-links";
import { DETAILS_ITEM } from "./details-item";
import { BranchesItem, type Branch } from "./other-branches";

/**
 * A business's details as one card — one shadcn Accordion whose items are
 * the rows (opening one closes the others):
 * - reviews → the reviews screen (a link, not a fold),
 * - working hours → the week,
 * - contact and links → every number and account,
 * - the address → the other branches (a plain link to Maps when there's
 *   only one branch),
 * then the first branch's map at the bottom.
 */
export function BusinessDetails({
  hours,
  socials,
  address,
  otherBranches,
  reviews,
  map,
}: {
  hours: { open: boolean; detail: string | null; days: HoursDay[] };
  socials: SocialLink[];
  /** The first branch: what it says and its pin in Maps. */
  address: Branch;
  otherBranches: Branch[];
  /** The rating, and the reviews screen it opens. */
  reviews: { average: number; count: number; href: string };
  /** The first branch's map (rendered on the server). */
  map: ReactNode;
}) {
  const { t, locale } = useLocale();
  const number = new Intl.NumberFormat(locale);
  const average = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(reviews.average);

  return (
    <Accordion className="rounded-2xl border-0 bg-card ring-1 ring-foreground/5">
      {/* Reviews: the rating, opening every review (its own screen). */}
      <div className={cn("not-last:border-b", DETAILS_ITEM)}>
        <StackLink
          href={reviews.href}
          className="flex min-h-11 items-center gap-3 px-4 py-2.5 text-start text-sm"
        >
          <HugeiconsIcon
            icon={StarIcon}
            strokeWidth={1.5}
            className={cn(
              "size-5 shrink-0",
              reviews.count > 0
                ? "fill-current text-amber-500"
                : "text-muted-foreground",
            )}
          />
          <span className="min-w-0 flex-1">
            {reviews.count > 0 ? (
              <>
                <span className="font-semibold tabular-nums">{average}</span>
                <span className="text-muted-foreground">
                  {" · "}
                  {t.plural(
                    reviews.count,
                    { one: "{{count}} review", other: "{{count}} reviews" },
                    { count: number.format(reviews.count) },
                  )}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">
                {t("No reviews yet.")}
              </span>
            )}
          </span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"
          />
        </StackLink>
      </div>
      <HoursItem {...hours} />
      <LinksItem socials={socials} />
      {otherBranches.length > 0 ? (
        <BranchesItem address={address.description} branches={otherBranches} />
      ) : (
        <div className={cn("not-last:border-b", DETAILS_ITEM)}>
          <a
            href={address.mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-3 px-4 py-2.5 text-start text-sm"
          >
            <HugeiconsIcon
              icon={Location01Icon}
              strokeWidth={2}
              role="img"
              aria-label={t("Address")}
              className="size-5 shrink-0 text-muted-foreground"
            />
            <span dir="auto" className="min-w-0 flex-1">
              {address.description}
            </span>
          </a>
        </div>
      )}
      {map}
    </Accordion>
  );
}
