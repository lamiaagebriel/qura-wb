"use client";


import {
  Controller,
  useWatch,
  type Control,
  type UseFormReturn,
} from "react-hook-form";

import { FormError } from "@/components/forms/form-error";
import { Copy01Icon, HugeiconsIcon } from "@/components/icons";
import { formatWeekday } from "@/components/profile/opening-hours";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { Toggle } from "@/components/ui/toggle";
import { useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { type BusinessFormValues } from "@/lib/validations/business-form";

import { JOINED } from "@/components/forms/joined-row";

type Form = Control<BusinessFormValues>;

/**
 * The week (Sunday first) as one card: per day a switch, then the opening
 * and closing times joined, a "24h" toggle and "copy to every day".
 */
export function HoursFields({ form }: { form: UseFormReturn<BusinessFormValues> }) {
  const { t, locale } = useLocale();
  const { control, setValue, getValues } = form;

  const copyToAll = (day: number) => {
    const slot = getValues(`hours.${day}`);
    for (let other = 0; other < 7; other++) {
      if (other !== day)
        setValue(
          `hours.${other}`,
          { ...slot },
          { shouldDirty: true, shouldValidate: true },
        );
    }
    toast.add({ title: t("Hours copied to every day"), type: "success" });
  };

  return (
    <FieldSet>
      <FieldLegend>{t("Working hours")}</FieldLegend>
      <div className="flex flex-col divide-y divide-border/60 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
        <div
          aria-hidden
          className={cn(DAY_ROW, "py-1.5 text-xs text-muted-foreground")}
        >
          <span />
          <span className="col-span-2 flex" dir="ltr">
            <span className="flex-1 text-center">{t("From")}</span>
            <span className="flex-1 text-center">{t("To")}</span>
          </span>
        </div>
        {Array.from({ length: 7 }, (_, day) => (
          <DayHours
            key={day}
            control={control}
            day={day}
            weekday={formatWeekday(day, locale)}
            shortWeekday={formatWeekday(day, locale, "short")}
            onCopyToAll={() => copyToAll(day)}
          />
        ))}
      </div>
      <FieldDescription>
        {t("Closing at 00:00 means midnight; 00:00 to 00:00 is open all day.")}
      </FieldDescription>
    </FieldSet>
  );
}

/** Day | from | to | 24h · copy · switch — shared by the header and every day. */
const DAY_ROW =
  "grid grid-cols-[3.25rem_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-x-1.5 px-3";

function DayHours({
  control,
  day,
  weekday,
  shortWeekday,
  onCopyToAll,
}: {
  control: Form;
  day: number;
  weekday: string;
  shortWeekday: string;
  onCopyToAll: () => void;
}) {
  const { t } = useLocale();
  const [open, from, to] = useWatch({
    control,
    name: [`hours.${day}.open`, `hours.${day}.from`, `hours.${day}.to`],
  });
  const allDay = open && from === "00:00" && to === "00:00";
  return (
    <div className="flex flex-col gap-1 py-2">
      {/* The whole day on one line. */}
      <div className={DAY_ROW}>
        <FieldLabel htmlFor={`hours-${day}`} className="truncate">
          <span aria-hidden>{shortWeekday}</span>
          <span className="sr-only">{weekday}</span>
        </FieldLabel>
        {!open ? (
          <span className="col-span-2 text-center text-sm text-muted-foreground">
            {t("Closed")}
          </span>
        ) : allDay ? (
          <span className="col-span-2 text-center text-sm text-muted-foreground">
            {t("Open 24 hours")}
          </span>
        ) : (
          <ButtonGroup dir="ltr" className={cn(JOINED, "col-span-2")}>
            <TimeInput
              control={control}
              day={day}
              end="from"
              weekday={weekday}
            />
            <TimeInput control={control} day={day} end="to" weekday={weekday} />
          </ButtonGroup>
        )}
        <div className="flex items-center">
          <Controller
            control={control}
            name={`hours.${day}`}
            render={({ field: slot }) => (
              <Toggle
                pressed={allDay}
                disabled={!open}
                aria-label={t("Open 24 hours on {{day}}", { day: weekday })}
                onPressedChange={(pressed) =>
                  slot.onChange(
                    pressed
                      ? { open: true, from: "00:00", to: "00:00" }
                      : { open: true, from: "09:00", to: "21:00" },
                  )
                }
                className="h-11 rounded-xl px-1.5 font-semibold"
              >
                24h
              </Toggle>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("Copy {{day}}'s hours to every day", {
              day: weekday,
            })}
            onClick={onCopyToAll}
            className="size-11 rounded-xl text-muted-foreground"
          >
            <HugeiconsIcon
              icon={Copy01Icon}
              className="size-4"
            />
          </Button>
          <Controller
            control={control}
            name={`hours.${day}.open`}
            render={({ field }) => (
              <Switch
                id={`hours-${day}`}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </div>
      {open && (
        <div className="px-3">
          <Controller
            control={control}
            name={`hours.${day}.from`}
            render={({ fieldState }) => <FormError error={fieldState.error} />}
          />
          <Controller
            control={control}
            name={`hours.${day}.to`}
            render={({ fieldState }) => <FormError error={fieldState.error} />}
          />
        </div>
      )}
    </div>
  );
}

function TimeInput({
  control,
  day,
  end,
  weekday,
}: {
  control: Form;
  day: number;
  end: "from" | "to";
  weekday: string;
}) {
  const { t } = useLocale();
  return (
    <Controller
      control={control}
      name={`hours.${day}.${end}`}
      render={({ field, fieldState }) => (
        <Input
          {...field}
          type="time"
          aria-label={
            end === "from"
              ? t("Opens on {{day}}", { day: weekday })
              : t("Closes on {{day}}", { day: weekday })
          }
          aria-invalid={fieldState.invalid}
          className="h-11 min-w-0 flex-1 px-1 text-center"
        />
      )}
    />
  );
}
