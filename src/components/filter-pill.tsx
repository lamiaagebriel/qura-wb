"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  ArrowDown01Icon,
  HugeiconsIcon,
  type IconSvgElement,
} from "@/components/icons";
import { overlaysSettled } from "@/components/navigation/use-back-to-close";
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
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const current = options.find((option) => option.value === value) ?? options[0];

  // The pick waits for the sheet to close and drop its history entry —
  // replacing the URL before that, the sheet's back would undo it.
  const [picked, setPicked] = useState<{ value: string | null } | null>(null);
  useEffect(() => {
    if (!picked || open) return;
    let cancelled = false;
    overlaysSettled().then(() => {
      if (cancelled) return;
      setPicked(null);
      // Other pills' choices (`?stars=` with `?sort=`) stay.
      const query = new URLSearchParams(window.location.search);
      if (picked.value) query.set(param, picked.value);
      else query.delete(param);
      const search = query.toString();
      startTransition(() =>
        router.replace(search ? `${pathname}?${search}` : pathname, {
          scroll: false,
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [picked, open, pathname, param, router]);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`${title}: ${current.short ?? current.label}`}
        onClick={() => setOpen(true)}
        // h-9 pill; the ::before stretches the tap area to 44px.
        className={cn(
          "relative flex h-9 max-w-48 items-center gap-1.5 rounded-full border border-border bg-card ps-2 pe-2.5 text-sm font-medium before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']",
          value && "border-primary/40 bg-primary/5",
        )}
      >
        {pending ? (
          <Spinner className="size-4" />
        ) : (
          <HugeiconsIcon icon={current.icon} strokeWidth={2} className="size-4 shrink-0" />
        )}
        <span className="truncate">{current.short ?? current.label}</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
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
          onSelect: () => setPicked({ value: option.value }),
        }))}
      />
    </>
  );
}
