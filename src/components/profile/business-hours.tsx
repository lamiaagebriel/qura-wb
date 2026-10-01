"use client";

import { Clock01Icon, HugeiconsIcon } from "@/components/icons";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

import { DETAILS_ITEM, DETAILS_TRIGGER } from "./details-item";

export type HoursDay = { label: string; hours: string; today: boolean };

/**
 * Working hours row: "Open now · Closes 11 PM"; tapping it slides the
 * whole week open (shadcn Accordion; today in bold). Everything arrives
 * formatted from the server, so "now" is the same on both sides.
 */
export function HoursItem({
  open,
  detail,
  days,
}: {
  open: boolean;
  /** "Closes 11 PM" / "Opens Tuesday 8 AM". */
  detail: string | null;
  days: HoursDay[];
}) {
  const { t } = useLocale();

  return (
    <AccordionItem value="hours" className={DETAILS_ITEM}>
      <AccordionTrigger
        aria-label={t("Working hours")}
        className={DETAILS_TRIGGER}
      >
        <HugeiconsIcon
          icon={Clock01Icon}
          strokeWidth={2}
          className="size-5 shrink-0 text-muted-foreground"
        />
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "font-semibold",
              open ? "text-green-600 dark:text-green-500" : "text-destructive",
            )}
          >
            {open ? t("Open now") : t("Closed")}
          </span>
          {detail && <span className="text-muted-foreground"> · {detail}</span>}
        </span>
      </AccordionTrigger>
      {/* The panel adds px-2; ps-10 lines the days up with the text above. */}
      <AccordionContent className="pb-3 ps-10 pe-2">
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
          {days.map(({ label, hours, today }) => (
            <div
              key={label}
              className={cn(
                "contents",
                today
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <dt>{label}</dt>
              <dd className="text-end tabular-nums">{hours}</dd>
            </div>
          ))}
        </dl>
      </AccordionContent>
    </AccordionItem>
  );
}
