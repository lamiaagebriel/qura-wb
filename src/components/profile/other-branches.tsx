"use client";

import {
  HugeiconsIcon,
  Location01Icon,
  MapsLocation01Icon,
} from "@/components/icons";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLocale } from "@/lib/i18n/provider";

import { DETAILS_ITEM, DETAILS_TRIGGER } from "./details-item";

export type Branch = { description: string; mapsHref: string };

/**
 * The address row of a business with several branches: the first branch's
 * address, how many others and a chevron; it slides open (like "Contact
 * and links") to the other addresses. Each is a link to its pin in Maps;
 * the map icon at the end says so. The first branch's map sits below.
 */
export function BranchesItem({
  address,
  branches,
}: {
  /** The first branch's address (the one on the map). */
  address: string;
  branches: Branch[];
}) {
  const { t, locale } = useLocale();

  return (
    <AccordionItem value="branches" className={DETAILS_ITEM}>
      <AccordionTrigger
        aria-label={`${address} · ${t("Other branches")}`}
        className={DETAILS_TRIGGER}
      >
        <HugeiconsIcon
          icon={Location01Icon}
          strokeWidth={2}
          className="size-5 shrink-0 text-muted-foreground"
        />
        <span dir="auto" className="min-w-0 flex-1 text-start">
          {address}
        </span>
        {/* "+1": how many more branches open below. */}
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
          {new Intl.NumberFormat(locale, { signDisplay: "always" }).format(
            branches.length,
          )}
        </span>
      </AccordionTrigger>
      {/* The panel adds px-2; -mx-2 gives the rows the card's full width. */}
      <AccordionContent className="-mx-2 pb-1">
        <ul>
          {branches.map(({ description, mapsHref }) => (
            <li key={mapsHref}>
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${description} · ${t("Open in Maps")}`}
                className="flex min-h-11 items-center gap-3 px-4 py-2 text-sm"
              >
                <span dir="auto" className="min-w-0 flex-1 ps-8 text-start">
                  {description}
                </span>
                <HugeiconsIcon
                  icon={MapsLocation01Icon}
                  strokeWidth={2}
                  className="size-5 shrink-0 text-primary"
                />
              </a>
            </li>
          ))}
        </ul>
      </AccordionContent>
    </AccordionItem>
  );
}
