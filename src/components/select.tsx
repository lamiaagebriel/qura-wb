"use client";

import { useState } from "react";

import { HugeiconsIcon, type IconSvgElement } from "@/components/icons";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsIos } from "@/hooks/use-is-ios";
import { cn } from "@/lib/utils";

/**
 * `icon`: shown in the dropdown and on the closed field. The native iOS
 * wheel is drawn by iOS from plain text, so its list has no icons.
 */
export type SelectOption = { value: string; label: string; disabled?: boolean; icon?: IconSvgElement };

// The app's rounder, full-width fields (44px tall). Text stays Mira's size;
// on phones globals.css lifts it to 16px so iOS never zooms on focus.
const FIELD = "w-full rounded-xl";

/**
 * The one select for the whole app: shadcn's Select everywhere, the native
 * picker wheel on iPhone and iPad, where it's the control people expect.
 * Controlled with `value`, or uncontrolled with `defaultValue` + `name`
 * (e.g. a GET filter form); both versions submit `name`.
 */
export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  onBlur,
  name,
  id,
  disabled,
  className,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}) {
  const ios = useIsIos();
  // Uncontrolled (`defaultValue`): what's picked now, for the iOS icon.
  const [picked, setPicked] = useState(defaultValue);
  // A value is the option's key and identity: if a caller repeats one (often a
  // second "" placeholder), the first wins.
  const unique = options.filter((o, i) => options.findIndex((p) => p.value === o.value) === i);

  if (ios) {
    const icon = unique.find((o) => o.value === (value ?? picked))?.icon;
    return (
      <div className={cn("relative w-full", className)}>
        <NativeSelect
          id={id}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={(e) => {
            setPicked(e.target.value);
            onValueChange?.(e.target.value);
          }}
          onBlur={onBlur}
          disabled={disabled}
          // The <select> inside gets the app's size.
          className={cn(
            "w-full [&_select]:h-11 [&_select]:rounded-xl [&_select]:ps-3 [&_select]:pe-8",
            // Room for the chosen option's icon, drawn over the field's start.
            icon && "[&_select]:ps-9",
          )}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid}
        >
          {unique.map((option) => (
            <NativeSelectOption key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {/* Beside the <select> (it only takes options); taps pass through to it. */}
        {icon && (
          <HugeiconsIcon
            icon={icon}
            aria-hidden
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
          />
        )}
      </div>
    );
  }

  return (
    <SelectRoot
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.(String(next ?? ""))}
      disabled={disabled}
      items={unique}
    >
      <SelectTrigger
        id={id}
        onBlur={onBlur}
        className={cn(FIELD, "px-3 data-[size=default]:h-11", className)}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
      >
        <SelectValue>
          {(current: string) => {
            const option = unique.find((o) => o.value === current);
            return option ? <OptionLabel option={option} /> : null;
          }}
        </SelectValue>
      </SelectTrigger>
      {/* As wide as its longest option (never cut), at least the field's width. */}
      <SelectContent className="w-max min-w-(--anchor-width) max-w-(--available-width)">
        {unique.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled} className="min-h-11">
            <OptionLabel option={option} />
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}

/** An option's icon (if any), then its label. */
function OptionLabel({ option }: { option: SelectOption }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {option.icon && <HugeiconsIcon icon={option.icon} className="size-4 shrink-0" />}
      <span className="truncate">{option.label}</span>
    </span>
  );
}
