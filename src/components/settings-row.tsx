"use client";

import type { ComponentProps } from "react";

import { HugeiconsIcon, type IconSvgElement } from "@/components/icons";

/**
 * One tappable row of a settings list: label at the start, icon at the end.
 * Every clickable settings item uses this so they all look the same.
 */
export function SettingsRow({
  label,
  icon,
  last,
  ...props
}: {
  label: string;
  icon: IconSvgElement;
  last?: React.ReactNode;
} & ComponentProps<"button">) {
  return (
    <button
      type="button"
      className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-2 text-start"
      {...props}
    >
      <span className="text-sm font-medium">{label}</span>

      <div className="flex items-center gap-2">
        {last}
        <HugeiconsIcon
          icon={icon}
          strokeWidth={2}
          className="size-5 text-muted-foreground"
        />
      </div>
    </button>
  );
}
