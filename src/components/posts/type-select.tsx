"use client";

import { useState } from "react";

import { ArrowDown01Icon, HugeiconsIcon } from "@/components/icons";
import { ActionSheet } from "@/components/sheets/action-sheet";
import { useLocale } from "@/lib/i18n/provider";
import type { PostType } from "@/lib/posts";
import { cn } from "@/lib/utils";

import { POST_TYPE_META } from "./type-meta";

/**
 * The post's type as a select-style field (its icon, name and a chevron);
 * tapping it lists `types` in an action sheet — the app's way to choose
 * (never a menu or popover).
 */
export function TypeSelect({
  id,
  types,
  value,
  onChange,
  label,
  invalid,
}: {
  id?: string;
  types: readonly PostType[];
  value: PostType;
  onChange: (type: PostType) => void;
  label: string;
  invalid?: boolean;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const meta = POST_TYPE_META[value];

  return (
    <>
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        data-invalid={invalid || undefined}
        aria-label={`${label}: ${t(meta.label)}`}
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center gap-3 rounded-xl border border-input bg-input/20 ps-2 pe-3 text-start text-base data-invalid:border-destructive dark:bg-input/30"
      >
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            meta.tint,
          )}
        >
          <HugeiconsIcon icon={meta.icon} strokeWidth={2} className="size-4" />
        </span>
        <span className="flex-1 truncate font-medium">{t(meta.label)}</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className="size-4 text-muted-foreground"
        />
      </button>
      <ActionSheet
        open={open}
        onOpenChange={setOpen}
        title={label}
        actions={types.map((type) => ({
          label: t(POST_TYPE_META[type].label),
          icon: POST_TYPE_META[type].icon,
          iconColors: POST_TYPE_META[type].tint,
          onSelect: () => onChange(type),
        }))}
      />
    </>
  );
}
