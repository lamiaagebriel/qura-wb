"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import type { FilterOption } from "@/components/filter-pill";
import {
  FilterHorizontalIcon,
  HugeiconsIcon,
  Tick02Icon,
} from "@/components/icons";
import { LIST_ROW } from "@/components/list-row";
import { overlaysSettled } from "@/components/navigation/use-back-to-close";
import { SheetFrame } from "@/components/sheets/action-sheet";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/** One filter in the sheet: its URL parameter, heading, choices and current one. */
export type FilterGroup = {
  param: string;
  title: string;
  /** `null`: the first option (the default: "All", "Newest"). */
  value: string | null;
  options: FilterOption[];
};

/**
 * Picks a value for `?<param>=` once the sheet that offered it has closed and
 * dropped its history entry (replaced before that, the sheet's back would undo
 * it). Same screen: replaced, not pushed; other parameters stay.
 */
export function useUrlPick(open: boolean) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [picked, setPicked] = useState<{
    param: string;
    value: string | null;
  } | null>(null);
  useEffect(() => {
    if (!picked || open) return;
    let cancelled = false;
    overlaysSettled().then(() => {
      if (cancelled) return;
      setPicked(null);
      const query = new URLSearchParams(window.location.search);
      if (picked.value) query.set(picked.param, picked.value);
      else query.delete(picked.param);
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
  }, [picked, open, pathname, router]);
  return {
    pick: (param: string, value: string | null) => setPicked({ param, value }),
    pending,
  };
}

/**
 * A screen's filters as one icon in its header (`AppHeader`'s `action`): a
 * dot while any is set; tapping it opens a sheet with a section per filter
 * (type; stars and order…), the current choice ticked. Picking one closes
 * the sheet and filters in place (the URL, so it can be shared).
 */
export function HeaderFilter({
  title,
  groups,
}: {
  title: string;
  groups: FilterGroup[];
}) {
  const [open, setOpen] = useState(false);
  const { pick, pending } = useUrlPick(open);
  const shown = groups.filter((group) => group.options.length > 1);
  if (!shown.length) return null;
  const current = shown
    .map(
      (group) =>
        group.options.find((o) => o.value === group.value) ?? group.options[0],
    )
    .map((option) => option.short ?? option.label)
    .join(", ");
  const filtered = shown.some((group) => group.value !== null);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-lg"
        aria-haspopup="dialog"
        aria-label={`${title}: ${current}`}
        onClick={() => setOpen(true)}
        className="relative size-11 rounded-full"
      >
        {pending ? (
          <Spinner className="size-5" />
        ) : (
          <HugeiconsIcon icon={FilterHorizontalIcon} className="size-5" />
        )}
        {filtered && (
          <span
            aria-hidden
            className="absolute end-2.5 top-2.5 size-2 rounded-full bg-primary ring-2 ring-background"
          />
        )}
      </Button>
      <SheetFrame open={open} onOpenChange={setOpen} title={title}>
        <div className="flex flex-col gap-4">
          {shown.map((group) => (
            <section
              key={group.param}
              aria-label={group.title}
              className="flex flex-col gap-1.5"
            >
              {shown.length > 1 && (
                <h3 className="px-1 text-xs font-medium text-muted-foreground uppercase">
                  {group.title}
                </h3>
              )}
              <div className="flex flex-col divide-y divide-border/60 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
                {group.options.map((option) => {
                  const selected = option.value === group.value;
                  return (
                    <button
                      key={option.value ?? ""}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setOpen(false);
                        if (!selected) pick(group.param, option.value);
                      }}
                      className={cn(
                        LIST_ROW,
                        "justify-start gap-3",
                        selected && "font-semibold",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full",
                          option.iconColors,
                        )}
                      >
                        <HugeiconsIcon icon={option.icon} className="size-4" />
                      </span>
                      <span className="flex-1 text-start">{option.label}</span>
                      {selected && (
                        <HugeiconsIcon
                          icon={Tick02Icon}
                          className="size-5 text-primary"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </SheetFrame>
    </>
  );
}
