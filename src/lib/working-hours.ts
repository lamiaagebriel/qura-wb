import * as z from "zod";

import type { Dict } from "@/lib/i18n/config";

type Translate = (key: keyof Dict) => string;

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAYS)[number];

export const DAY_LABEL: Record<DayKey, keyof Dict> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export type TimeRange = { open: string; close: string };

// A day is nothing more than its list of open ranges — an empty list
// *is* "closed", not a separate flag to keep in sync. One range is the
// common case; more than one is a split shift (lunch break, etc).
export type WorkingHours = Record<DayKey, TimeRange[]>;

export const EMPTY_WORKING_HOURS: WorkingHours = DAYS.reduce(
  (acc, day) => ({ ...acc, [day]: [] }),
  {} as WorkingHours,
);

const timeRangeSchema = z.object({
  open: z.string().regex(TIME_RE),
  close: z.string().regex(TIME_RE),
});

const dayRangesSchema = z.array(timeRangeSchema);

export function createWorkingHoursSchema() {
  return z.object({
    mon: dayRangesSchema,
    tue: dayRangesSchema,
    wed: dayRangesSchema,
    thu: dayRangesSchema,
    fri: dayRangesSchema,
    sat: dayRangesSchema,
    sun: dayRangesSchema,
  });
}

function formatRanges(ranges: TimeRange[], t: Translate): string {
  if (ranges.length === 0) return t("Closed");
  return ranges.map((r) => `${r.open}–${r.close}`).join(", ");
}

/** One line per day, in week order — a business's hours read the same
 * way every time, so a viewer can find "what about Tuesday" at a glance
 * instead of parsing a grouped range. */
export function formatWorkingHours(
  hours: WorkingHours | null | undefined,
  t: Translate,
): { day: string; label: string }[] {
  if (!hours) return [];
  return DAYS.map((day) => ({
    day: t(DAY_LABEL[day]),
    label: formatRanges(hours[day] ?? [], t),
  }));
}
