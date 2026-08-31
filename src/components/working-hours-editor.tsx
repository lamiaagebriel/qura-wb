"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Copy01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DAYS,
  DAY_LABEL,
  type DayKey,
  type TimeRange,
  type WorkingHours,
} from "@/lib/working-hours";
import type { Dict } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/client";

type Translate = (key: keyof Dict) => string;

const DEFAULT_RANGE: TimeRange = { open: "09:00", close: "17:00" };

/**
 * A per-day picker for a business's working hours. Each day is either
 * closed (empty range list — no separate flag to fall out of sync) or
 * open across one or more time ranges (a lunch-break split shift is just
 * a second range on the same day). The copy icon on each day replicates
 * that day's exact ranges onto the other six, since "the same hours six
 * days a week" is the common case and re-entering it seven times isn't
 * a reasonable way to ask for it.
 */
export function WorkingHoursEditor({
  value,
  onChange,
}: {
  value: WorkingHours;
  onChange: (next: WorkingHours) => void;
}) {
  const { t } = useLocale();
  function setDay(day: DayKey, ranges: TimeRange[]) {
    onChange({ ...value, [day]: ranges });
  }

  function toggleOpen(day: DayKey, open: boolean) {
    setDay(day, open ? [DEFAULT_RANGE] : []);
  }

  function copyToAll(day: DayKey) {
    const ranges = value[day];
    const next = DAYS.reduce(
      (acc, d) => ({ ...acc, [d]: ranges }),
      {} as WorkingHours,
    );
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      {DAYS.map((day) => {
        const ranges = value[day] ?? [];
        const open = ranges.length > 0;

        return (
          <div key={day} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-foreground w-10 shrink-0 text-[12.5px] font-medium">
                {t(DAY_LABEL[day])}
              </span>
              <Switch
                checked={open}
                onCheckedChange={(checked) => toggleOpen(day, checked)}
              />
              <span className="text-muted-foreground flex-1 text-[12px]">
                {open ? t("Open") : t("Closed")}
              </span>
              {open && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title={t("Copy to all days")}
                  onClick={() => copyToAll(day)}
                >
                  <HugeiconsIcon icon={Copy01Icon} className="size-3.5" />
                </Button>
              )}
            </div>

            {open && (
              <div className="ms-12 flex flex-col gap-1.5">
                {ranges.map((range, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <Input
                      type="time"
                      value={range.open}
                      onChange={(e) => {
                        const next = [...ranges];
                        next[index] = { ...range, open: e.target.value };
                        setDay(day, next);
                      }}
                      className="w-auto flex-1"
                    />
                    <span className="text-muted-foreground text-[12px]">–</span>
                    <Input
                      type="time"
                      value={range.close}
                      onChange={(e) => {
                        const next = [...ranges];
                        next[index] = { ...range, close: e.target.value };
                        setDay(day, next);
                      }}
                      className="w-auto flex-1"
                    />
                    {ranges.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          setDay(
                            day,
                            ranges.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          className="size-3.5"
                        />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit"
                  onClick={() => setDay(day, [...ranges, DEFAULT_RANGE])}
                >
                  <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
                  {t("Add time range")}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
