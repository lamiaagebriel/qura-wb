"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  ArrowDown01Icon,
  FilterHorizontalIcon,
  HugeiconsIcon,
} from "@/components/icons";
import { overlaysSettled } from "@/components/navigation/use-back-to-close";
import { ActionSheet } from "@/components/sheets/action-sheet";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/lib/i18n/provider";
import type { PostType } from "@/lib/posts";
import { cn } from "@/lib/utils";

import { POST_TYPE_META } from "./type-meta";

/**
 * Filters a list of posts by type: a pill with the current choice; tapping
 * it lists "All types" and `types` (with counts) in an action sheet. The
 * choice lives in the URL (`?type=`), so the server filters and the link
 * can be shared. Same screen: the URL is replaced, not pushed.
 */
export function PostTypeFilter({
  types,
  value,
}: {
  types: { type: PostType; count: number }[];
  value: PostType | null;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const number = new Intl.NumberFormat(locale);
  const label = value ? t(POST_TYPE_META[value].plural) : t("All types");

  // The pick waits for the sheet to close and drop its history entry —
  // replacing the URL before that, the sheet's back would undo it.
  const [picked, setPicked] = useState<{ type: PostType | null } | null>(null);
  useEffect(() => {
    if (!picked || open) return;
    let cancelled = false;
    overlaysSettled().then(() => {
      if (cancelled) return;
      setPicked(null);
      startTransition(() =>
        router.replace(
          picked.type ? `${pathname}?type=${picked.type}` : pathname,
          {
            scroll: false,
          },
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [picked, open, pathname, router]);
  const choose = (type: PostType | null) => setPicked({ type });

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`${t("Filter by type")}: ${label}`}
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
          <HugeiconsIcon
            icon={value ? POST_TYPE_META[value].icon : FilterHorizontalIcon}
            strokeWidth={2}
            className="size-4 shrink-0"
          />
        )}
        <span className="truncate">{label}</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className="size-3.5 shrink-0 text-muted-foreground"
        />
      </button>
      <ActionSheet
        open={open}
        onOpenChange={setOpen}
        title={t("Filter by type")}
        actions={[
          {
            label: t("All types"),
            icon: FilterHorizontalIcon,
            iconColors: "bg-muted text-foreground",
            onSelect: () => choose(null),
          },
          ...types.map(({ type, count }) => ({
            label: `${t(POST_TYPE_META[type].plural)} · ${number.format(count)}`,
            icon: POST_TYPE_META[type].icon,
            iconColors: POST_TYPE_META[type].tint,
            onSelect: () => choose(type),
          })),
        ]}
      />
    </>
  );
}
