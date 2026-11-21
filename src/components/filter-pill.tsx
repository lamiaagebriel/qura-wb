"use client";

import { useState } from "react";

import {
  ArrowDown01Icon,
  HugeiconsIcon,
  type IconSvgElement,
} from "@/components/icons";
import { useUrlPick } from "@/components/header-filter";
import { buttonVariants } from "@/components/ui/button";
import { ActionSheet } from "@/components/sheets/action-sheet";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type FilterOption = {
  /** The URL value; `null` is "all" (no parameter). */
  value: string | null;
  /** In the sheet (with its count). */
  label: string;
  /** On the pill, once picked (default: `label`). */
  short?: string;
  icon: IconSvgElement;
  iconColors: string;
};

/**
 * Filters a list in place: a pill with the current choice; tapping it
 * lists `options` in an action sheet. The choice lives in the URL
 * (`?<param>=`), so the server filters and the link can be shared. Same
 * screen: the URL is replaced, not pushed; other parameters stay. Posts by
 * type, reviews by stars and order.
 */
export function FilterPill({
  param,
  value,
  title,
  options,
}: {
  param: string;
  value: string | null;
  /** The sheet's title, and the pill's name ("Filter by type: …"). */
  title: string;
  options: FilterOption[];
}) {
  const [open, setOpen] = useState(false);
  const { pick, pending } = useUrlPick(open);
  const current =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`${title}: ${current.short ?? current.label}`}
        onClick={() => setOpen(true)}
        // h-9 pill; the ::before stretches the tap area to 44px.
        className={cn(
          buttonVariants({ variant: "outline" }),
          "relative h-9 max-w-48 gap-1.5 rounded-full bg-card ps-2 pe-2.5 before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']",
          value && "border-primary/40 bg-primary/5",
        )}
      >
        {pending ? (
          <Spinner className="size-4" />
        ) : (
          <HugeiconsIcon icon={current.icon} className="size-4 shrink-0" />
        )}
        <span className="truncate">{current.short ?? current.label}</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className="size-3.5 shrink-0 text-muted-foreground"
        />
      </button>
      <ActionSheet
        open={open}
        onOpenChange={setOpen}
        title={title}
        actions={options.map((option) => ({
          label: option.label,
          icon: option.icon,
          iconColors: option.iconColors,
          onSelect: () => pick(param, option.value),
        }))}
      />
    </>
  );
}
