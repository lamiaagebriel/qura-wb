"use client";

import type { ComponentProps } from "react";

import { HugeiconsIcon, type IconSvgElement } from "@/components/icons";
import { LIST_ROW } from "@/components/list-row";

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
      className={LIST_ROW}
      {...props}
    >
      <span className="font-medium">{label}</span>

      <div className="flex items-center gap-2">
        {last}
        <HugeiconsIcon
          icon={icon}
          className="size-5 text-muted-foreground"
        />
      </div>
    </button>
  );
}
