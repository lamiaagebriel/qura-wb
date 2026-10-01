// Opening hours: is the business open right now, and when does that change.
// Times are "HH:MM" in the business's own time zone ("24:00" = midnight).

import type { OpeningHours } from "./fake-profile";

const minutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/** Weekday (0 = Sunday) and minutes since midnight, in `timeZone`. */
function localNow(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)!.value;
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    part("weekday"),
  );
  return { day, minute: Number(part("hour")) * 60 + Number(part("minute")) };
}

type OpeningStatus = {
  today: number;
  open: boolean;
  /** When it closes (open) or next opens (closed); `null` = never opens. */
  next: { day: number; time: string } | null;
};

export function openingStatus(
  hours: (OpeningHours | null)[],
  timeZone: string,
): OpeningStatus {
  const { day, minute } = localNow(timeZone);
  const today = hours[day];
  if (today && minute >= minutes(today.open) && minute < minutes(today.close)) {
    return { today: day, open: true, next: { day, time: today.close } };
  }
  if (today && minute < minutes(today.open)) {
    return { today: day, open: false, next: { day, time: today.open } };
  }
  for (let i = 1; i <= 7; i++) {
    const next = (day + i) % 7;
    const slot = hours[next];
    if (slot)
      return { today: day, open: false, next: { day: next, time: slot.open } };
  }
  return { today: day, open: false, next: null };
}

/** Open around the clock that day ("00:00"–"24:00"). */
export const isAllDay = (slot: OpeningHours | null) =>
  slot?.open === "00:00" && slot.close === "24:00";

/** "11:00 PM" / "٢٣:٠٠" — an "HH:MM" wall time in `locale`. */
export function formatTime(time: string, locale: string) {
  const [h, m] = time.split(":").map(Number);
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(Date.UTC(2026, 0, 4, h, m));
}

/** "Sunday" / "الأحد" for weekday 0–6. */
export function formatWeekday(
  day: number,
  locale: string,
  width: "long" | "short" = "long",
) {
  // 4 January 2026 is a Sunday.
  return new Intl.DateTimeFormat(locale, {
    weekday: width,
    timeZone: "UTC",
  }).format(Date.UTC(2026, 0, 4 + day));
}
