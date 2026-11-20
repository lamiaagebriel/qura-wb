"use client";

import { useState } from "react";
import { arEG, enGB } from "react-day-picker/locale";

import { Calendar03Icon, HugeiconsIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsIos } from "@/hooks/use-is-ios";
import { useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

// Day, month and year joined by hand: server and browser Intl disagree on the
// separators (e.g. an Arabic comma), which breaks hydration.
const label = (day: string, locale: string) => {
  const tag = locale === "ar" ? "ar-EG" : "en-GB";
  const part = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(tag, o).format(toDate(day));
  return [part({ day: "numeric" }), part({ month: "short" }), part({ year: "numeric" })].join(" ");
};

/** "YYYY-MM-DD" ⇄ a local Date at noon, so no time zone can shift the day. */
const toDate = (day: string) => new Date(`${day}T12:00:00`);
const toDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/**
 * The one date field for the whole app, like `Select`: shadcn's calendar in a
 * popover everywhere, the native date wheel on iPhone and iPad. Values are
 * "YYYY-MM-DD" ("" = none). Controlled with `value`, or uncontrolled with
 * `defaultValue` + `name` (e.g. a GET filter form); both versions submit `name`.
 */
export function DatePicker({
  value,
  defaultValue,
  onValueChange,
  onBlur,
  name,
  id,
  min,
  max,
  placeholder,
  disabled,
  className,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}) {
  const ios = useIsIos();
  const { locale } = useLocale();
  const [own, setOwn] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const current = value ?? own;
  const change = (next: string) => {
    setOwn(next);
    onValueChange?.(next);
  };

  if (ios) {
    return (
      <Input
        type="date"
        id={id}
        name={name}
        value={current}
        min={min}
        max={max}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        className={cn("h-11 w-full rounded-xl px-3", className)}
        onChange={(e) => change(e.target.value)}
        onBlur={onBlur}
      />
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onBlur?.();
      }}
    >
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            aria-label={ariaLabel}
            aria-invalid={ariaInvalid}
            className={cn(
              "h-11 w-full justify-start gap-2 rounded-xl px-3 font-normal",
              !current && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <HugeiconsIcon icon={Calendar03Icon} className="size-4" />
        <span className="tabular-nums">{current ? label(current, locale) : (placeholder ?? "—")}</span>
      </PopoverTrigger>
      {name && <input type="hidden" name={name} value={current} />}
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={locale === "ar" ? arEG : enGB}
          selected={current ? toDate(current) : undefined}
          defaultMonth={current ? toDate(current) : undefined}
          disabled={[...(min ? [{ before: toDate(min) }] : []), ...(max ? [{ after: toDate(max) }] : [])]}
          formatters={{
            formatWeekdayName: (day) => day.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", { weekday: "narrow" }),
          }}
          onSelect={(date) => {
            if (!date) return;
            change(toDay(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
